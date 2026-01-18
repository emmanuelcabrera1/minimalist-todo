//
//  StreakCalculator.swift
//  Experiments
//
//  Streak calculation logic for experiments.
//

import Foundation

/// Utility for calculating streak counts.
/// A streak is consecutive scheduled periods with completed entries.
enum StreakCalculator {
    
    /// Calculates the current streak for an experiment.
    /// - Parameter experiment: The experiment to analyze.
    /// - Returns: Number of consecutive completed scheduled periods.
    static func calculateStreak(for experiment: Experiment) -> Int {
        let today = Date().toLocalDateString()
        let scheduledDates = generateScheduledDates(
            start: experiment.startDate,
            end: min(Date(), experiment.endDate),
            frequency: experiment.frequency,
            customDays: experiment.customFrequencyDays
        )
        
        // Build set of completed dates for O(1) lookup
        let completedDates: Set<String> = Set(
            experiment.entries
                .filter { $0.isCompleted }
                .map { $0.scheduledDate }
        )
        
        // Count backwards from most recent scheduled date
        var streak = 0
        for date in scheduledDates.reversed() {
            if completedDates.contains(date) {
                streak += 1
            } else {
                // Allow today to be incomplete without breaking streak
                if date == today {
                    continue
                }
                break
            }
        }
        
        return streak
    }
    
    /// Generates all scheduled check-in dates for an experiment.
    /// - Parameters:
    ///   - start: Experiment start date.
    ///   - end: End date (capped at today for active experiments).
    ///   - frequency: Check-in frequency.
    ///   - customDays: Custom interval if frequency is .custom.
    /// - Returns: Array of date strings in YYYY-MM-DD format.
    static func generateScheduledDates(
        start: Date,
        end: Date,
        frequency: ExperimentFrequency,
        customDays: Int? = nil
    ) -> [String] {
        var dates: [String] = []
        var current = start
        let calendar = Calendar.current
        let interval = frequency.intervalDays(customDays: customDays)
        
        while current <= end {
            dates.append(current.toLocalDateString())
            
            guard let next = calendar.date(byAdding: .day, value: interval, to: current) else {
                break
            }
            current = next
        }
        
        return dates
    }
    
    /// Calculates completion rate as a percentage.
    /// - Parameter experiment: The experiment to analyze.
    /// - Returns: Percentage of scheduled periods completed (0-100).
    static func completionRate(for experiment: Experiment) -> Double {
        let scheduledDates = generateScheduledDates(
            start: experiment.startDate,
            end: min(Date(), experiment.endDate),
            frequency: experiment.frequency,
            customDays: experiment.customFrequencyDays
        )
        
        guard !scheduledDates.isEmpty else { return 0 }
        
        let completedDates = Set(
            experiment.entries
                .filter { $0.isCompleted }
                .map { $0.scheduledDate }
        )
        
        let completed = scheduledDates.filter { completedDates.contains($0) }.count
        return Double(completed) / Double(scheduledDates.count) * 100
    }
}
