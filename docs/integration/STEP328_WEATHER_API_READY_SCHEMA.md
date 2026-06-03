# STEP328 天気API連携準備・データ設計

## 内容
本物のAPI連携前に、天気カードのデータ構造と取得口を整理。

## 追加した標準データ項目
- date
- weatherDate
- venue
- venueLat
- venueLng
- prefecture
- weatherProvider
- weatherUpdatedAt
- condition
- currentTemp
- highTemp
- lowTemp
- rainProbability
- windSpeed
- windDirection
- humidity
- adviceTitle
- adviceText
- isMock
- sourceLabel

## 追加API
`window.PNXWeatherCard`
- normalizeData(data)
- fetchWeather(options)
- mapApiWeatherData(apiData, context)

## Bridge追加
`window.PNXCalendarWeatherBridge`
- getWeatherContext()

## 使い方
将来APIを繋ぐ時は `PNXWeatherCard.fetchWeather()` の中身を差し替える。
現在はダミーデータをPromiseで返す。

## 確認ログ
`[ProNexaX Calendar] STEP328 WEATHER API READY SCHEMA LOADED`
