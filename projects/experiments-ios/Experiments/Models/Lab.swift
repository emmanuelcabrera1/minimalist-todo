//
//  Lab.swift
//  Experiments
//
//  Lab model for organizing experiments into categories.
//

import Foundation
import SwiftData

/// A Lab is a category/folder for organizing experiments (e.g., "Health", "Focus", "Growth").
@Model
final class Lab {
    
    // MARK: - Properties
    
    /// Unique identifier for sync and indexing.
    @Attribute(.unique)
    var id: UUID
    
    /// Display name of the lab.
    var name: String
    
    /// Hex color string for visual coding (e.g., "#FF5733").
    var colorHex: String
    
    /// Sort order for manual reordering.
    var sortOrder: Int
    
    /// Creation timestamp.
    var createdAt: Date
    
    /// Last modification timestamp.
    var updatedAt: Date
    
    // MARK: - Relationships
    
    /// Experiments belonging to this lab.
    @Relationship(deleteRule: .nullify, inverse: \Experiment.lab)
    var experiments: [Experiment] = []
    
    // MARK: - Initialization
    
    init(
        id: UUID = UUID(),
        name: String,
        colorHex: String = "#000000",
        sortOrder: Int = 0
    ) {
        self.id = id
        self.name = name
        self.colorHex = colorHex
        self.sortOrder = sortOrder
        self.createdAt = Date()
        self.updatedAt = Date()
    }
}

// MARK: - Convenience

extension Lab {
    
    /// Default labs for onboarding.
    static let defaultLabs: [(name: String, colorHex: String)] = [
        ("Health", "#34C759"),
        ("Focus", "#007AFF"),
        ("Growth", "#FF9500"),
        ("Relationships", "#FF2D55")
    ]
}
