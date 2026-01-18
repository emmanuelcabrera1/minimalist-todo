//
//  ExperimentStatus.swift
//  Experiments
//
//  Enum for experiment lifecycle status.
//

import Foundation

/// Status of an experiment in its lifecycle.
enum ExperimentStatus: String, Codable, CaseIterable {
    /// Currently running and accepting check-ins.
    case active
    
    /// Paused or archived by user.
    case archived
    
    /// Duration completed successfully.
    case completed
    
    /// Human-readable display name.
    var displayName: String {
        switch self {
        case .active: return "Active"
        case .archived: return "Archived"
        case .completed: return "Completed"
        }
    }
    
    /// Icon name for status.
    var iconName: String {
        switch self {
        case .active: return "play.circle.fill"
        case .archived: return "archivebox"
        case .completed: return "checkmark.circle.fill"
        }
    }
}
