//
//  ExperimentTemplate.swift
//  Experiments
//
//  Template model for Ideas Gallery.
//

import Foundation

/// A template for creating new experiments from the Gallery.
struct ExperimentTemplate: Identifiable, Codable {
    let id: String
    let title: String
    let purpose: String
    let successCriteria: String?
    let durationDays: Int
    let frequency: ExperimentFrequency
    let category: String
    let description: String
    let icon: String
}

/// Container for template JSON parsing.
struct TemplatesContainer: Codable {
    let templates: [ExperimentTemplate]
}

/// Loader for bundled templates.
enum TemplateLoader {
    
    /// Loads templates from bundled JSON file.
    static func loadBundledTemplates() -> [ExperimentTemplate] {
        guard let url = Bundle.main.url(forResource: "templates", withExtension: "json"),
              let data = try? Data(contentsOf: url),
              let container = try? JSONDecoder().decode(TemplatesContainer.self, from: data) else {
            return fallbackTemplates
        }
        return container.templates
    }
    
    /// Fallback templates if JSON loading fails.
    static let fallbackTemplates: [ExperimentTemplate] = [
        ExperimentTemplate(
            id: "meditation-30",
            title: "30 Days of Meditation",
            purpose: "Reduce stress and improve focus through daily mindfulness",
            successCriteria: "Meditate for at least 10 minutes each day",
            durationDays: 30,
            frequency: .daily,
            category: "Health",
            description: "Start each morning with a 10-minute meditation session.",
            icon: "brain.head.profile"
        ),
        ExperimentTemplate(
            id: "no-social-media-7",
            title: "7-Day Digital Detox",
            purpose: "Reclaim time and attention from social media",
            successCriteria: "No social media apps for 7 days",
            durationDays: 7,
            frequency: .daily,
            category: "Focus",
            description: "Delete social apps and notice how you spend your time.",
            icon: "iphone.slash"
        ),
        ExperimentTemplate(
            id: "reading-30",
            title: "Read 30 Minutes Daily",
            purpose: "Build a consistent reading habit",
            successCriteria: "Read for 30 minutes before bed",
            durationDays: 30,
            frequency: .daily,
            category: "Growth",
            description: "Replace screen time with book time.",
            icon: "book"
        ),
        ExperimentTemplate(
            id: "gratitude-21",
            title: "21-Day Gratitude Journal",
            purpose: "Shift perspective toward positivity",
            successCriteria: "Write 3 things you're grateful for each day",
            durationDays: 21,
            frequency: .daily,
            category: "Relationships",
            description: "End each day by writing what went well.",
            icon: "heart.text.square"
        ),
        ExperimentTemplate(
            id: "cold-shower-14",
            title: "Cold Shower Challenge",
            purpose: "Build mental resilience and energy",
            successCriteria: "End shower with 30 seconds of cold water",
            durationDays: 14,
            frequency: .daily,
            category: "Health",
            description: "Gradually increase cold exposure.",
            icon: "snowflake"
        )
    ]
}
