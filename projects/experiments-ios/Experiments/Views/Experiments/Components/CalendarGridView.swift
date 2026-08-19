//
//  CalendarGridView.swift
//  Experiments
//
//  Month grid calendar showing completion status.
//

import SwiftUI

/// Calendar grid showing experiment progress by day.
struct CalendarGridView: View {
    
    let experiment: Experiment
    
    @State private var displayedMonth = Date()
    
    private let columns = Array(repeating: GridItem(.flexible()), count: 7)
    private let weekdaySymbols = Calendar.current.veryShortWeekdaySymbols
    
    var body: some View {
        VStack(spacing: 20) {
            // Month Navigation
            HStack {
                Button {
                    moveMonth(by: -1)
                } label: {
                    Image(systemName: "chevron.left")
                        .font(.title3)
                }
                
                Spacer()
                
                Text(displayedMonth.formatted(.dateTime.month(.wide).year()))
                    .font(.headline)
                
                Spacer()
                
                Button {
                    moveMonth(by: 1)
                } label: {
                    Image(systemName: "chevron.right")
                        .font(.title3)
                }
            }
            
            // Weekday Headers
            LazyVGrid(columns: columns, spacing: 8) {
                ForEach(weekdaySymbols, id: \.self) { symbol in
                    Text(symbol)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }
            
            // Day Grid
            LazyVGrid(columns: columns, spacing: 8) {
                ForEach(daysInMonth(), id: \.self) { day in
                    DayCell(
                        day: day,
                        status: statusFor(day: day),
                        isToday: Calendar.current.isDateInToday(day)
                    )
                }
            }
        }
    }
    
    private func moveMonth(by value: Int) {
        if let newDate = Calendar.current.date(byAdding: .month, value: value, to: displayedMonth) {
            displayedMonth = newDate
        }
    }
    
    private func daysInMonth() -> [Date] {
        let calendar = Calendar.current
        let interval = calendar.dateInterval(of: .month, for: displayedMonth)!
        
        let firstWeekday = calendar.component(.weekday, from: interval.start)
        let offsetDays = firstWeekday - calendar.firstWeekday
        let adjustedOffset = offsetDays >= 0 ? offsetDays : offsetDays + 7
        
        var days: [Date] = []
        
        // Add padding days from previous month
        for i in 0..<adjustedOffset {
            if let day = calendar.date(byAdding: .day, value: i - adjustedOffset, to: interval.start) {
                days.append(day)
            }
        }
        
        // Add days of current month
        var current = interval.start
        while current < interval.end {
            days.append(current)
            current = calendar.date(byAdding: .day, value: 1, to: current)!
        }
        
        // Pad to complete last week
        while days.count % 7 != 0 {
            if let next = calendar.date(byAdding: .day, value: 1, to: days.last!) {
                days.append(next)
            }
        }
        
        return days
    }
    
    private func statusFor(day: Date) -> DayStatus {
        let dateString = day.toLocalDateString()
        let calendar = Calendar.current
        
        // Check if in experiment range
        guard day >= experiment.startDate && day <= experiment.endDate else {
            return .outside
        }
        
        // Check if future
        if day > Date() {
            return .future
        }
        
        // Check if scheduled day
        let scheduledDates = StreakCalculator.generateScheduledDates(
            start: experiment.startDate,
            end: experiment.endDate,
            frequency: experiment.frequency,
            customDays: experiment.customFrequencyDays
        )
        
        guard scheduledDates.contains(dateString) else {
            return .notScheduled
        }
        
        // Check entry status
        if let entry = experiment.entries.first(where: { $0.scheduledDate == dateString }) {
            return entry.isCompleted ? .completed : .missed
        }
        
        // Scheduled but no entry yet
        return .pending
    }
}

// MARK: - Day Cell

struct DayCell: View {
    let day: Date
    let status: DayStatus
    let isToday: Bool
    
    var body: some View {
        ZStack {
            Circle()
                .fill(backgroundColor)
                .frame(width: 36, height: 36)
            
            Text("\(Calendar.current.component(.day, from: day))")
                .font(.system(size: 14, weight: isToday ? .bold : .regular))
                .foregroundStyle(foregroundColor)
        }
    }
    
    private var backgroundColor: Color {
        switch status {
        case .completed:
            return Color.primary
        case .missed:
            return Color(.systemGray5)
        case .pending, .notScheduled, .future, .outside:
            return Color.clear
        }
    }
    
    private var foregroundColor: Color {
        switch status {
        case .completed:
            return Color(.systemBackground)
        case .missed:
            return .secondary
        case .outside:
            return .quaternary
        default:
            return .primary
        }
    }
}

enum DayStatus {
    case completed    // Entry completed
    case missed       // Entry marked as missed
    case pending      // Scheduled but no entry yet
    case notScheduled // Within range but not a scheduled day
    case future       // Future date
    case outside      // Outside experiment range
}

#Preview {
    CalendarGridView(
        experiment: Experiment(
            title: "Test",
            purpose: "Testing",
            durationDays: 30
        )
    )
    .padding()
    .modelContainer(for: [Experiment.self], inMemory: true)
}
