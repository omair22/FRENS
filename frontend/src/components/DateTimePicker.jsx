import React, { useState, useEffect, useMemo } from 'react'

const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const hours = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']
const minutes = ['00', '15', '30', '45']

const getNextInterval = () => {
    const d = new Date()
    const currentMins = d.getMinutes()
    let addMins = 0
    if (currentMins === 0) addMins = 30
    else if (currentMins <= 30) addMins = 30 - currentMins
    else addMins = 60 - currentMins
    d.setMinutes(currentMins + addMins)
    return d
}

const DateTimePicker = ({ initialValue, onChange, defaultToNow = true }) => {
    const initialTime = initialValue ? new Date(initialValue) : (defaultToNow ? getNextInterval() : null)

    const [selectedDate, setSelectedDate] = useState(initialTime || (defaultToNow ? new Date() : null))

    let initHr = initialTime ? initialTime.getHours() : 12
    const initAmPm = initHr >= 12 ? 'PM' : 'AM'
    initHr = initHr % 12 || 12
    const initMin = initialTime ?
        (initialTime.getMinutes() < 15 ? '00'
            : initialTime.getMinutes() < 30 ? '15'
                : initialTime.getMinutes() < 45 ? '30' : '45')
        : '00'

    const [selectedHour, setSelectedHour] = useState(initHr.toString())
    const [selectedMinute, setSelectedMinute] = useState(initMin)
    const [selectedAmPm, setSelectedAmPm] = useState(initAmPm)

    const days = useMemo(() => Array.from({ length: 1825 }, (_, i) => {
        const d = new Date()
        d.setDate(d.getDate() + i)
        return d
    }), [])

    useEffect(() => {
        if (!selectedDate) return
        const d = new Date(selectedDate)
        let h = parseInt(selectedHour)
        if (selectedAmPm === 'PM' && h < 12) h += 12
        if (selectedAmPm === 'AM' && h === 12) h = 0
        d.setHours(h, parseInt(selectedMinute), 0, 0)

        onChange(d.toISOString())
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedDate, selectedHour, selectedMinute, selectedAmPm])

    return (
        <div className="space-y-4 w-full text-left">
            {/* Day Scroller */}
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 -mx-1 px-1">
                {days.map((d, i) => {
                    const isSelected = selectedDate && d.toDateString() === selectedDate.toDateString()
                    const isToday = i === 0
                    return (
                        <button
                            key={i}
                            type="button"
                            onClick={() => setSelectedDate(d)}
                            className={`flex-shrink-0 flex flex-col items-center gap-1 w-14 py-3 rounded-2xl transition-all duration-200 ${isSelected
                                    ? 'bg-primary-red text-background scale-105 shadow-lg shadow-primary-red/30'
                                    : 'bg-white/5 border border-white/5 opacity-60 hover:opacity-100'
                                }`}
                        >
                            <span className="text-[8px] font-black uppercase tracking-wider">
                                {isToday ? 'Today' : dayLabels[d.getDay()]}
                            </span>
                            <span className="text-lg font-display font-black leading-none">{d.getDate()}</span>
                            <span className="text-[8px] opacity-60">{monthLabels[d.getMonth()]}</span>
                        </button>
                    )
                })}
            </div>

            {/* Time Picker */}
            {selectedDate && (
                <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="text-[8px] font-black uppercase tracking-widest opacity-30 text-center mt-2">
                        What time?
                    </div>
                    <div className="flex items-center justify-center gap-3">
                        {/* Hour */}
                        <div className="flex flex-wrap gap-1.5 justify-center max-w-[120px]">
                            {hours.map(h => (
                                <button
                                    key={h}
                                    type="button"
                                    onClick={() => setSelectedHour(h)}
                                    className={`w-9 h-9 rounded-xl text-sm font-black transition-all duration-150 ${selectedHour === h
                                            ? 'bg-primary-yellow text-background scale-110 shadow-md shadow-primary-yellow/30'
                                            : 'bg-white/5 opacity-40 hover:opacity-80'
                                        }`}
                                >
                                    {h}
                                </button>
                            ))}
                        </div>

                        <div className="text-2xl font-display font-black opacity-20">:</div>

                        {/* Minute */}
                        <div className="flex flex-col gap-1.5">
                            {minutes.map(m => (
                                <button
                                    key={m}
                                    type="button"
                                    onClick={() => setSelectedMinute(m)}
                                    className={`w-14 h-9 rounded-xl text-sm font-black transition-all duration-150 ${selectedMinute === m
                                            ? 'bg-primary-yellow text-background shadow-md shadow-primary-yellow/30'
                                            : 'bg-white/5 opacity-40 hover:opacity-80'
                                        }`}
                                >
                                    :{m}
                                </button>
                            ))}
                        </div>

                        {/* AM/PM */}
                        <div className="flex flex-col gap-1.5">
                            {['AM', 'PM'].map(period => (
                                <button
                                    key={period}
                                    type="button"
                                    onClick={() => setSelectedAmPm(period)}
                                    className={`w-12 h-9 rounded-xl text-[11px] font-black transition-all duration-150 ${selectedAmPm === period
                                            ? 'bg-primary-green text-background shadow-md shadow-primary-green/30'
                                            : 'bg-white/5 opacity-40 hover:opacity-80'
                                        }`}
                                >
                                    {period}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Preview */}
                    <div className="text-center text-primary-yellow font-display font-black text-sm opacity-80 pt-2 pb-2">
                        {dayLabels[selectedDate.getDay()]}, {monthLabels[selectedDate.getMonth()]} {selectedDate.getDate()} at {selectedHour}:{selectedMinute} {selectedAmPm}
                    </div>
                </div>
            )}

            {!selectedDate && (
                <p className="text-center text-[10px] font-bold opacity-20 py-2">Pick a day above ↑</p>
            )}
        </div>
    )
}

export default DateTimePicker
