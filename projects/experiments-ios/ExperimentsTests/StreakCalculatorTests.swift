//
//  StreakCalculatorTests.swift
//  ExperimentsTests
//
//  Unit tests for streak calculation logic.
//

import XCTest
@testable import Experiments

final class StreakCalculatorTests: XCTestCase {
    
    // MARK: - Test Helpers
    
    private func createExperiment(
        startDate: Date = Date(),
        durationDays: Int = 30,
        frequency: ExperimentFrequency = .daily
    ) -> Experiment {
        Experiment(
            title: "Test Experiment",
            purpose: "Testing",
            startDate: startDate,
            durationDays: durationDays,
            frequency: frequency
        )
    }
    
    private func addEntry(
        to experiment: Experiment,
        daysAgo: Int,
        isCompleted: Bool = true
    ) {
        let date = Calendar.current.date(byAdding: .day, value: -daysAgo, to: Date())!
        let entry = Entry(
            experiment: experiment,
            scheduledDate: date.toLocalDateString(),
            isCompleted: isCompleted
        )
        experiment.entries.append(entry)
    }
    
    // MARK: - Tests
    
    func testEmptyExperimentHasZeroStreak() {
        let experiment = createExperiment()
        
        let streak = StreakCalculator.calculateStreak(for: experiment)
        
        XCTAssertEqual(streak, 0, "Empty experiment should have 0 streak")
    }
    
    func testSingleCompletedEntryGivesStreakOfOne() {
        let experiment = createExperiment(
            startDate: Calendar.current.date(byAdding: .day, value: -1, to: Date())!
        )
        addEntry(to: experiment, daysAgo: 1, isCompleted: true)
        
        let streak = StreakCalculator.calculateStreak(for: experiment)
        
        XCTAssertEqual(streak, 1, "Single completed entry should give streak of 1")
    }
    
    func testConsecutiveCompletedEntriesGiveCorrectStreak() {
        let experiment = createExperiment(
            startDate: Calendar.current.date(byAdding: .day, value: -5, to: Date())!
        )
        
        // Add 5 consecutive completed days
        for i in 1...5 {
            addEntry(to: experiment, daysAgo: i, isCompleted: true)
        }
        
        let streak = StreakCalculator.calculateStreak(for: experiment)
        
        XCTAssertEqual(streak, 5, "5 consecutive completed days should give streak of 5")
    }
    
    func testMissedDayBreaksStreak() {
        let experiment = createExperiment(
            startDate: Calendar.current.date(byAdding: .day, value: -5, to: Date())!
        )
        
        // Day 1, 2 completed, Day 3 missed, Day 4, 5 completed
        addEntry(to: experiment, daysAgo: 1, isCompleted: true)
        addEntry(to: experiment, daysAgo: 2, isCompleted: true)
        addEntry(to: experiment, daysAgo: 3, isCompleted: false) // Missed
        addEntry(to: experiment, daysAgo: 4, isCompleted: true)
        addEntry(to: experiment, daysAgo: 5, isCompleted: true)
        
        let streak = StreakCalculator.calculateStreak(for: experiment)
        
        XCTAssertEqual(streak, 2, "Streak should be 2 (days after the missed day)")
    }
    
    func testWeeklyFrequencyStreak() {
        let experiment = createExperiment(
            startDate: Calendar.current.date(byAdding: .day, value: -21, to: Date())!,
            durationDays: 30,
            frequency: .weekly
        )
        
        // Week 1 (21 days ago), Week 2 (14 days ago), Week 3 (7 days ago)
        addEntry(to: experiment, daysAgo: 21, isCompleted: true)
        addEntry(to: experiment, daysAgo: 14, isCompleted: true)
        addEntry(to: experiment, daysAgo: 7, isCompleted: true)
        
        let streak = StreakCalculator.calculateStreak(for: experiment)
        
        XCTAssertEqual(streak, 3, "3 consecutive weekly check-ins should give streak of 3")
    }
    
    func testTodayIncompleteDoesNotBreakStreak() {
        let experiment = createExperiment(
            startDate: Calendar.current.date(byAdding: .day, value: -3, to: Date())!
        )
        
        // Yesterday and day before completed, today not yet
        addEntry(to: experiment, daysAgo: 1, isCompleted: true)
        addEntry(to: experiment, daysAgo: 2, isCompleted: true)
        // No entry for today (daysAgo: 0)
        
        let streak = StreakCalculator.calculateStreak(for: experiment)
        
        XCTAssertEqual(streak, 2, "Today being incomplete should not break yesterday's streak")
    }
    
    func testCompletionRateCalculation() {
        let experiment = createExperiment(
            startDate: Calendar.current.date(byAdding: .day, value: -10, to: Date())!
        )
        
        // 7 completed out of 10 scheduled days
        for i in 1...7 {
            addEntry(to: experiment, daysAgo: i, isCompleted: true)
        }
        addEntry(to: experiment, daysAgo: 8, isCompleted: false)
        addEntry(to: experiment, daysAgo: 9, isCompleted: false)
        addEntry(to: experiment, daysAgo: 10, isCompleted: false)
        
        let rate = StreakCalculator.completionRate(for: experiment)
        
        XCTAssertEqual(rate, 70.0, accuracy: 0.1, "Completion rate should be 70%")
    }
    
    func testScheduledDatesGeneration() {
        let startDate = Date.fromLocalDateString("2024-01-01")!
        let endDate = Date.fromLocalDateString("2024-01-07")!
        
        let dates = StreakCalculator.generateScheduledDates(
            start: startDate,
            end: endDate,
            frequency: .daily
        )
        
        XCTAssertEqual(dates.count, 7, "Should generate 7 daily dates")
        XCTAssertEqual(dates.first, "2024-01-01")
        XCTAssertEqual(dates.last, "2024-01-07")
    }
    
    func testWeeklyScheduledDatesGeneration() {
        let startDate = Date.fromLocalDateString("2024-01-01")!
        let endDate = Date.fromLocalDateString("2024-01-29")!
        
        let dates = StreakCalculator.generateScheduledDates(
            start: startDate,
            end: endDate,
            frequency: .weekly
        )
        
        XCTAssertEqual(dates.count, 5, "Should generate 5 weekly dates over 29 days")
    }
}
