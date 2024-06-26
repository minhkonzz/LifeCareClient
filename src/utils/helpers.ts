import { getLocalTimeV1, getDayTitle, getDatesRange, timestampToDateTime, getMonthTitle } from "./datetimes"

export const handleErrorMessage = (message: string) => {
   const splits: string[] = message.split(': ')
   return splits[splits.length === 1 && 0 || 1].toUpperCase()
}

export const getBMIStatus = (value: number): string => {
   return (
      value < 16 && 'Severe Thinness' ||
      value >= 16 && value < 17 && 'Moderate thinness' ||
      value >= 17 && value < 18.5 && 'Mild thinness' || 
      value >= 18.5 && value < 25 && 'Normal' ||
      value >= 25 && value < 30 && 'Overweight' ||
      value >= 30 && value < 35 && 'Obese class 1' || 'Obese class 2'
   )
}

export const autoId = (prefix: string): string => {
   const timestamp = Date.now().toString(36)
   const random = Math.random().toString(36).slice(2, 8)
   return prefix + timestamp + random
}

export const formatNum = (value: number): string => {
   return value.toString().padStart(2, '0')
}

export const convertObjectKeysToCamelCase = (obj: any): any =>
   Object.keys(obj).reduce((convertedObj, key) => {
      const convertedKey = key.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase())
      convertedObj[convertedKey] = obj[key]
      return convertedObj
   }, {})

export const convertObjectKeysToSnakeCase = (obj: any) =>
   Object.keys(obj).reduce((convertedObj, key) => {
      const convertedKey = key.replace(/([A-Z])/g, '_$1').toLowerCase()
      convertedObj[convertedKey] = obj[key]
      return convertedObj
   }, {})

export const handleHydrateRecords = (records: any[], todayRecord: { id: string, goal: number, value: number, date: string }) => {
   const daysIntake: any[] = []
   const { id, date, goal, value } = todayRecord

   const standard = records.reduce((acc: any, cur: any) => {
		const { id, date, value, goal } = cur
		acc[date] = { id, value, goal }
		return acc
	}, { [date]: { id, value, goal } })

	const chartData = getDatesRange(122).map(e => {
		const r = standard[e.value]
		if (r) {
			const { value, goal, id } = r
         daysIntake.push(value)
			return { date: e.value, value, goal, id }
		}
		return `${getMonthTitle(e.month, true)} ${formatNum(e.date)}`
	})

   const avgIntake: number = daysIntake.reduce((acc: any, cur: any) => acc + cur, 0) / daysIntake.length
   return { chartData, avgIntake }
}

export const handleFastingRecords = (records: any[]) => {
   let maxMiliseconds: number = 0
   const daysHours: any[] = []

   const transform = (startTimestamp: number, endTimestamp: number) => {
      const startDate = new Date(startTimestamp)
      const endDate = new Date(endTimestamp)
      const fastingData = {}

      const currentDate = new Date(startDate)
      while (currentDate.getDate() <= endDate.getDate() + 1) {
         const startOfDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate())
         const endOfDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() + 1)

         const startTimeStamp = Math.max(startOfDay.getTime(), startDate.getTime())
         const endTimeStamp = Math.min(endOfDay.getTime(), endDate.getTime())

         const totalMilliseconds = endTimeStamp - startTimeStamp
         const totalHours = totalMilliseconds / (1000 * 60 * 60)

         if (totalHours >= 1) {
            const formatter = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: 'numeric', hour12: false })
            const startTime = formatter.format(getLocalTimeV1(new Date(startTimeStamp)))
            const endTime = formatter.format(getLocalTimeV1(new Date(endTimeStamp)))
            const y = currentDate.getFullYear()
            const m = formatNum(currentDate.getMonth() + 1)
            const d = formatNum(currentDate.getDate())
            const date: string = `${y}-${m}-${d}`
            const e = fastingData[date] || []
            fastingData[date] = [...e, { startTime, endTime, totalHours: Math.round(totalHours) }]
         }
         currentDate.setDate(currentDate.getDate() + 1)
      }
      return fastingData
   }

   const standard = records.reduce((acc, cur) => {
      const { startTimeStamp, endTimeStamp } = cur
      const totalMiliseconds: number = endTimeStamp - startTimeStamp
      if (totalMiliseconds > maxMiliseconds) maxMiliseconds = totalMiliseconds
      const handled = transform(startTimeStamp, endTimeStamp)
      const dates = Object.keys(handled)
      for (let i = 0; i < dates.length; i++) {
         const v = handled[dates[i]]
         const e = acc[dates[i]]
         acc[dates[i]] = e && [...e, ...v] || v
      }
      return acc
   }, {})
 
   const chartData = getDatesRange(122).map(e => {
		const r = standard[e.value]
      if (r) {
         const totalDayHours: number = r.reduce((acc: any, cur: any) => acc + cur.totalHours, 0)
         daysHours.push(totalDayHours)
         return { date: e.value, records: r }
      }
      return `${getMonthTitle(e.month, true)} ${formatNum(e.date)}`
	})
   
   const avgHoursPerDay: number = daysHours.reduce((acc: number, cur: number) => acc + cur, 0) / daysHours.length
   return { chartData, maxMiliseconds, avgHoursPerDay }
}

export const handleWeightRecords = (records: any[]) => {
   let visitedMonth: string = ''
   let visitedValue: number = 0
   let startIndex: number = 0
   let endIndex: number = 0

   const weightRecords = records.filter((e: any) => e.type === 'weight')
   const standard = weightRecords.reduce((acc: any, cur: any) => {
      const { id, createdAt, value } = cur
      const d = new Date(createdAt)
      acc[`${d.getFullYear()}-${formatNum(d.getMonth() + 1)}-${formatNum(d.getDate())}`] = { id, value }
      return acc
   }, {})

   const chartData = getDatesRange(122).map((e, i) => {
      const r = standard[e.value]
      const { month, date } = e
      const monthTitle: string = getMonthTitle(month, true)
      const isNextMonth: boolean = monthTitle !== visitedMonth
      if (isNextMonth) visitedMonth = monthTitle
      const currentPointTitle = `${isNextMonth ? monthTitle + ' ' : '' }${date}`
      if (r) {
         const { value } = r
         if (!startIndex) startIndex = i
         visitedValue = value
         endIndex = i
         return { value, label: currentPointTitle }
      }
      return { value: visitedValue, label: currentPointTitle, hideDataPoint: true }
   })

   return { chartData, startIndex, endIndex }
}

export const handleTimelineData = (waterRecords: any[], bodyRecords: any[], fastingRecords: any[]) => {
   const handled = [
      ...waterRecords.reduce((acc, cur) => {
         const { date, times, goal } = cur
         const d = new Date(date)
         const day = getDayTitle(d, true)
         const _d = d.getDate()
         const month = d.getMonth()
         const year = d.getFullYear()
         return [...acc, ...times.map((e: any) => {
            const timeRec = convertObjectKeysToCamelCase(e)
            const datetimeCreated: Date = new Date(timeRec.createdAt)
            const hour: number = datetimeCreated.getHours()
            const min: number = datetimeCreated.getMinutes()
            const sec: number = datetimeCreated.getSeconds()
            return {
               id: timeRec.id,
               value: timeRec.value,
               goal,
               type: 'water',
               day,
               date: _d,
               month,
               year,
               hour,
               min,
               sec
            }
         })]
      }, []),
      
      ...bodyRecords.reduce((acc, cur) => {
         const datetimeCreated: Date = new Date(cur.createdAt)
         const day = getDayTitle(datetimeCreated, true)
         const date = datetimeCreated.getDate()
         const month = datetimeCreated.getMonth()
         const year = datetimeCreated.getFullYear()
         const hour = datetimeCreated.getHours()
         const min = datetimeCreated.getMinutes()
         const sec = datetimeCreated.getSeconds()
         return [...acc, {
            id: cur.id,
            value: cur.value,
            type: 'weight',
            day,
            date,
            month,
            year,
            hour,
            min, 
            sec
         }]
      }, []),

      ...fastingRecords.reduce((acc, cur) => {
         const datetimeCreated: Date = new Date(cur.createdAt.split('+')[0])
         const day = getDayTitle(datetimeCreated, true)
         const date = datetimeCreated.getDate()
         const month = datetimeCreated.getMonth()
         const year = datetimeCreated.getFullYear()
         const hour = datetimeCreated.getHours()
         const min = datetimeCreated.getMinutes()
         const sec = datetimeCreated.getSeconds()

         const start: Date = new Date(cur.startTimeStamp)
         const end: Date = new Date(cur.endTimeStamp)
         
         return [...acc, {
            id: cur.id,
            plan: cur.planName,
            start: start.toLocaleString(),
            startTimeStamp: cur.startTimeStamp,
            endTimeStamp: cur.endTimeStamp, 
            end: end.toLocaleString(),
            total: timestampToDateTime(cur.endTimeStamp - cur.startTimeStamp),
            type: 'fasting',
            day,
            date,
            month,
            year, 
            hour,
            min,
            sec
         }]
      }, [])
   ]

   return handled.sort((a, b) => {
      const aDatetime = new Date(`${a.year}-${a.month}-${a.date} ${a.hour}:${a.min}:${a.sec}`)
      const bDatetime = new Date(`${b.year}-${b.month}-${b.date} ${b.hour}:${b.min}:${b.sec}`)
      return bDatetime.getTime() - aDatetime.getTime()
   })
}