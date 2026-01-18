//
//  ExperimentFrequency.swift
//  Experiments
//
//  Enum for experiment check-in frequency.
//

import Foundation

/// Frequency options for experiment check-ins.
/// Represents the "Continuous" part of PACT.
enum ExperimentFrequency: String, Codable, CaseIterable {
    /// Check in every day.
    case daily
    
    /// Check in once per week.
    case weekly
    
    /// Custom interval (uses Experiment.customFrequencyDays).
    case custom
    
    /// Human-readable display name.
    var displayName: String {
        switch self {
        case .daily: return "Daily"
        case .weekly: return "Weekly"
        case .custom: return "Custom"
        }
    }
    
    /// Short description for UI.
    var description: String {
        switch self {
        case .daily: return "Every day"
        case .weekly: return "Once a week"
        case .custom: return "Custom interval"
        }
    }
    
    /// Days between check-ins.
    func intervalDays(customDays: Int? = nil) -> Int {
        switch self {
        case .daily: return 1
        case .weekly: return 7
        case .custom: return customDays ?? 1
        }
    }
}
