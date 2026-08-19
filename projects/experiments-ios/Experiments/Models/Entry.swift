//
//  Entry.swift
//  Experiments
//
//  Entry model for daily/weekly check-ins (the ACT phase).
//

import Foundation
import SwiftData

/// An Entry represents a single check-in for an experiment.
/// This is the "ACT" phase of the Tiny Experiments Framework.
@Model
final class Entry {
    
    // MARK: - Properties
    
    /// Unique identifier.
    @Attribute(.unique)
    var id: UUID
    
    /// Parent experiment.
    var experiment: Experiment?
    
    /// Scheduled date as string (YYYY-MM-DD format).
    /// Using string avoids timezone/DST issues.
    var scheduledDate: String
    
    /// Whether the check-in was completed (true) or missed (false).
    var isCompleted: Bool
    
    /// Optional text note for the entry.
    var noteText: String?
    
    /// Optional photo filename (relative to app container).
    var photoFileName: String?
    
    // MARK: - Metadata
    
    var createdAt: Date
    var updatedAt: Date
    
    // MARK: - Initialization
    
    init(
        id: UUID = UUID(),
        experiment: Experiment? = nil,
        scheduledDate: String,
        isCompleted: Bool = true,
        noteText: String? = nil,
        photoFileName: String? = nil
    ) {
        self.id = id
        self.experiment = experiment
        self.scheduledDate = scheduledDate
        self.isCompleted = isCompleted
        self.noteText = noteText
        self.photoFileName = photoFileName
        self.createdAt = Date()
        self.updatedAt = Date()
    }
    
    // MARK: - Convenience
    
    /// Creates an entry for today's date.
    static func forToday(experiment: Experiment, isCompleted: Bool = true) -> Entry {
        Entry(
            experiment: experiment,
            scheduledDate: Date().toLocalDateString(),
            isCompleted: isCompleted
        )
    }
}

// MARK: - Date String Helpers

extension Date {
    
    /// Converts to local date string (YYYY-MM-DD).
    func toLocalDateString() -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        formatter.timeZone = .current
        return formatter.string(from: self)
    }
    
    /// Creates date from local date string.
    static func fromLocalDateString(_ string: String) -> Date? {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        formatter.timeZone = .current
        return formatter.date(from: string)
    }
}
