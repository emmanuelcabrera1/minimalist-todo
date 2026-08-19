//
//  Experiment.swift
//  Experiments
//
//  Core experiment model implementing the PACT framework.
//

import Foundation
import SwiftData

/// An Experiment represents a time-bound personal experiment.
/// Implements the Tiny Experiments Framework (PACT):
/// - **P**urposeful: `purpose` field
/// - **A**ctionable: `title` field
/// - **C**ontinuous: `frequency` field
/// - **T**rackable: `successCriteria` field
@Model
final class Experiment {
    
    // MARK: - PACT Fields
    
    /// Unique identifier.
    @Attribute(.unique)
    var id: UUID
    
    /// Actionable title (the "A" in PACT).
    var title: String
    
    /// Purpose/Why (the "P" in PACT).
    var purpose: String
    
    /// Success criteria for tracking (the "T" in PACT).
    var successCriteria: String?
    
    // MARK: - Timeline
    
    /// Start date of the experiment.
    var startDate: Date
    
    /// Duration in days (e.g., 30, 7, 90).
    var durationDays: Int
    
    /// Check-in frequency (the "C" in PACT).
    var frequency: ExperimentFrequency
    
    /// Custom frequency interval (when frequency == .custom).
    var customFrequencyDays: Int?
    
    // MARK: - Status
    
    /// Current status of the experiment.
    var status: ExperimentStatus
    
    // MARK: - Relationships
    
    /// Parent lab (category).
    var lab: Lab?
    
    /// Check-in entries (the ACT phase).
    @Relationship(deleteRule: .cascade, inverse: \Entry.experiment)
    var entries: [Entry] = []
    
    /// Reminders for notifications.
    @Relationship(deleteRule: .cascade, inverse: \Reminder.experiment)
    var reminders: [Reminder] = []
    
    /// Reflections (the REACT phase).
    @Relationship(deleteRule: .cascade, inverse: \Reflection.experiment)
    var reflections: [Reflection] = []
    
    // MARK: - Metadata
    
    var createdAt: Date
    var updatedAt: Date
    
    // MARK: - Initialization
    
    init(
        id: UUID = UUID(),
        title: String,
        purpose: String,
        successCriteria: String? = nil,
        startDate: Date = Date(),
        durationDays: Int = 30,
        frequency: ExperimentFrequency = .daily,
        customFrequencyDays: Int? = nil,
        status: ExperimentStatus = .active,
        lab: Lab? = nil
    ) {
        self.id = id
        self.title = title
        self.purpose = purpose
        self.successCriteria = successCriteria
        self.startDate = startDate
        self.durationDays = durationDays
        self.frequency = frequency
        self.customFrequencyDays = customFrequencyDays
        self.status = status
        self.lab = lab
        self.createdAt = Date()
        self.updatedAt = Date()
    }
    
    // MARK: - Computed Properties
    
    /// Calculated end date based on start + duration.
    var endDate: Date {
        Calendar.current.date(byAdding: .day, value: durationDays, to: startDate) ?? startDate
    }
    
    /// Progress as a percentage (0.0 to 1.0).
    var progressPercentage: Double {
        let total = Double(durationDays)
        guard total > 0 else { return 0 }
        let elapsed = Double(Calendar.current.dateComponents([.day], from: startDate, to: Date()).day ?? 0)
        return min(max(elapsed / total, 0), 1.0)
    }
    
    /// Number of days with completed entries.
    var daysCompleted: Int {
        entries.filter { $0.isCompleted }.count
    }
    
    /// Days remaining until end date.
    var daysRemaining: Int {
        let remaining = Calendar.current.dateComponents([.day], from: Date(), to: endDate).day ?? 0
        return max(remaining, 0)
    }
    
    /// Current streak count using the streak algorithm.
    var currentStreak: Int {
        StreakCalculator.calculateStreak(for: self)
    }
    
    /// Whether the experiment is currently running.
    var isActive: Bool {
        status == .active && Date() <= endDate
    }
}
