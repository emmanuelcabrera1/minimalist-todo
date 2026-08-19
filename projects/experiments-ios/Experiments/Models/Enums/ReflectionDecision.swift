//
//  ReflectionDecision.swift
//  Experiments
//
//  Enum for REACT phase decisions.
//

import Foundation

/// Decision outcomes from a reflection (REACT phase).
enum ReflectionDecision: String, Codable, CaseIterable {
    /// Continue the experiment as-is.
    case persist
    
    /// Modify the experiment approach.
    case pivot
    
    /// Stop or archive the experiment.
    case pause
    
    /// Human-readable display name.
    var displayName: String {
        switch self {
        case .persist: return "Persist"
        case .pivot: return "Pivot"
        case .pause: return "Pause"
        }
    }
    
    /// Description of the decision.
    var description: String {
        switch self {
        case .persist: return "Continue with the same approach"
        case .pivot: return "Adjust the experiment design"
        case .pause: return "Take a break or stop"
        }
    }
    
    /// Icon for the decision.
    var iconName: String {
        switch self {
        case .persist: return "arrow.forward.circle"
        case .pivot: return "arrow.triangle.2.circlepath"
        case .pause: return "pause.circle"
        }
    }
}
