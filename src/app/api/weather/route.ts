import { NextResponse } from "next/server";

// Mauritius center coordinates
const LAT = -20.2;
const LON = 57.5;

export async function GET() {
  const apiKey = process.env.OPENWEATHER_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Weather API key not configured" },
      { status: 503 }
    );
  }

  try {
    const [currentRes, forecastRes] = await Promise.all([
      fetch(
        `https://api.openweathermap.org/data/2.5/weather?lat=${LAT}&lon=${LON}&units=metric&appid=${apiKey}`
      ),
      fetch(
        `https://api.openweathermap.org/data/2.5/forecast?lat=${LAT}&lon=${LON}&units=metric&appid=${apiKey}`
      ),
    ]);

    if (!currentRes.ok || !forecastRes.ok) {
      return NextResponse.json(
        { error: "OpenWeather API error" },
        { status: 502 }
      );
    }

    const [currentData, forecastData] = await Promise.all([
      currentRes.json(),
      forecastRes.json(),
    ]);

    // Process forecast into daily summaries
    const dailyMap = new Map<
      string,
      { temps: number[]; icons: string[]; descs: string[]; pops: number[] }
    >();

    const today = new Date().toISOString().split("T")[0];
    for (const item of forecastData.list) {
      const date = item.dt_txt.split(" ")[0];
      if (date === today) continue;

      if (!dailyMap.has(date)) {
        dailyMap.set(date, { temps: [], icons: [], descs: [], pops: [] });
      }
      const d = dailyMap.get(date)!;
      d.temps.push(item.main.temp);
      d.icons.push(item.weather[0].icon);
      d.descs.push(item.weather[0].description);
      d.pops.push(item.pop || 0);
    }

    const forecast = Array.from(dailyMap.entries())
      .slice(0, 5)
      .map(([date, d]) => {
        const dt = new Date(date);
        return {
          date,
          dayName: dt.toLocaleDateString("en-US", { weekday: "short" }),
          high: Math.round(Math.max(...d.temps)),
          low: Math.round(Math.min(...d.temps)),
          icon: d.icons[Math.floor(d.icons.length / 2)],
          description: d.descs[Math.floor(d.descs.length / 2)],
          pop: Math.round(Math.max(...d.pops) * 100),
        };
      });

    const result = {
      current: {
        temp: Math.round(currentData.main.temp),
        feelsLike: Math.round(currentData.main.feels_like),
        description: currentData.weather[0].description,
        icon: currentData.weather[0].icon,
        humidity: currentData.main.humidity,
        windSpeed: Math.round(currentData.wind.speed * 3.6),
      },
      forecast,
    };

    return NextResponse.json(result, {
      headers: { "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600" },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch weather data" },
      { status: 500 }
    );
  }
}
