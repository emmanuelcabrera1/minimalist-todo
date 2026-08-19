//
//  Reminder.swift
//  Experiments
//
//  Reminder model for local notifications.
//

import Foundation
import SwiftData

/// A Reminder schedules local notifications for an experiment.
@Model
final class Reminder {
    
    // MARK: - Properties
    
    /// Unique identifier.
    @Attribute(.unique)
    var id: UUID
    
    /// Parent experiment.
    var experiment: Experiment?
    
    /// Hour of day (0-23).
    var hour: Int
    
    /// Minute of hour (0-59).
    var minute: Int
    
    /// Days of week to repeat (1=Sunday, 7=Saturday).
    var repeatDays: [Int]
    
    /// Whether this reminder is currently enabled.
    var isEnabled: Bool
    
    // MARK: - Initialization
    
    init(
        id: UUID = UUID(),
        experiment: Experiment? = nil,
        hour: Int = 9,
        minute: Int = 0,
        repeatDays: [Int] = [1, 2, 3, 4, 5, 6, 7], // Every day
        isEnabled: Bool = true
    ) {
        self.id = id
        self.experiment = experiment
        self.hour = hour
        self.minute = minute
        self.repeatDays = repeatDays
        self.isEnabled = isEnabled
    }
    
    // MARK: - Computed
    
    /// Formatted time string (e.g., "9:00 AM").
    var timeString: String {
        let formatter = DateFormatter()
        formatter.dateFormat = "h:mm a"
        
        var components = DateComponents()
        components.hour = hour
        components.minute = minute
        
        if let date = Calendar.current.date(from: components) {
            return formatter.string(from: date)
        }
        return "\(hour):\(String(format: "%02d", minute))"
    }
    
    /// Notification identifier prefix for this reminder.
    var notificationIdPrefix: String {
        "\(experiment?.id.uuidString ?? "unknown")-\(id.uuidString)"
    }
}
