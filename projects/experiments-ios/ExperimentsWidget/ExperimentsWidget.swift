//
//  ExperimentsWidget.swift
//  ExperimentsWidget
//
//  WidgetKit extension for home screen widgets.
//

import WidgetKit
import SwiftUI

// MARK: - Widget Data

struct ExperimentWidgetData: Codable, Identifiable {
    let id: UUID
    let title: String
    let progress: Double
    let streak: Int
    let daysRemaining: Int
}

// MARK: - Timeline Entry

struct ExperimentEntry: TimelineEntry {
    let date: Date
    let experiment: ExperimentWidgetData?
    let configuration: ConfigurationAppIntent
}

// MARK: - Configuration Intent

import AppIntents

struct ConfigurationAppIntent: WidgetConfigurationIntent {
    static var title: LocalizedStringResource = "Select Experiment"
    static var description = IntentDescription("Choose which experiment to display.")
    
    @Parameter(title: "Experiment")
    var experimentId: String?
}

// MARK: - Timeline Provider

struct Provider: AppIntentTimelineProvider {
    
    func placeholder(in context: Context) -> ExperimentEntry {
        ExperimentEntry(
            date: Date(),
            experiment: ExperimentWidgetData(
                id: UUID(),
                title: "Meditation",
                progress: 0.65,
                streak: 7,
                daysRemaining: 12
            ),
            configuration: ConfigurationAppIntent()
        )
    }
    
    func snapshot(for configuration: ConfigurationAppIntent, in context: Context) async -> ExperimentEntry {
        let experiments = loadExperiments()
        return ExperimentEntry(
            date: Date(),
            experiment: experiments.first,
            configuration: configuration
        )
    }
    
    func timeline(for configuration: ConfigurationAppIntent, in context: Context) async -> Timeline<ExperimentEntry> {
        let experiments = loadExperiments()
        
        var selectedExperiment: ExperimentWidgetData?
        if let idString = configuration.experimentId,
           let id = UUID(uuidString: idString) {
            selectedExperiment = experiments.first { $0.id == id }
        } else {
            selectedExperiment = experiments.first
        }
        
        let entry = ExperimentEntry(
            date: Date(),
            experiment: selectedExperiment,
            configuration: configuration
        )
        
        // Refresh every hour
        let nextUpdate = Calendar.current.date(byAdding: .hour, value: 1, to: Date())!
        
        return Timeline(entries: [entry], policy: .after(nextUpdate))
    }
    
    private func loadExperiments() -> [ExperimentWidgetData] {
        // Load from app group shared container
        let appGroupId = "group.com.experiments.app"
        guard let containerURL = FileManager.default.containerURL(
            forSecurityApplicationGroupIdentifier: appGroupId
        ) else {
            return []
        }
        
        let fileURL = containerURL.appendingPathComponent("widget_data.json")
        
        guard let data = try? Data(contentsOf: fileURL),
              let experiments = try? JSONDecoder().decode([ExperimentWidgetData].self, from: data) else {
            return []
        }
        
        return experiments
    }
}

// MARK: - Progress Widget View

struct ProgressWidgetView: View {
    let entry: ExperimentEntry
    
    var body: some View {
        if let experiment = entry.experiment {
            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    ProgressRing(progress: experiment.progress)
                        .frame(width: 50, height: 50)
                    
                    Spacer()
                    
                    Text("\(Int(experiment.progress * 100))%")
                        .font(.title2.bold())
                }
                
                Text(experiment.title)
                    .font(.headline)
                    .lineLimit(1)
                
                Text("\(experiment.daysRemaining) days left")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            .padding()
            .widgetURL(URL(string: "experiments://experiment/\(experiment.id.uuidString)"))
        } else {
            Text("No experiments")
                .font(.caption)
                .foregroundStyle(.secondary)
        }
    }
}

struct ProgressRing: View {
    let progress: Double
    
    var body: some View {
        ZStack {
            Circle()
                .stroke(Color.secondary.opacity(0.2), lineWidth: 4)
            
            Circle()
                .trim(from: 0, to: progress)
                .stroke(Color.primary, style: StrokeStyle(lineWidth: 4, lineCap: .round))
                .rotationEffect(.degrees(-90))
        }
    }
}

// MARK: - Streak Widget View

struct StreakWidgetView: View {
    let entry: ExperimentEntry
    
    var body: some View {
        if let experiment = entry.experiment {
            VStack(spacing: 8) {
                HStack(spacing: 4) {
                    Image(systemName: "flame.fill")
                        .font(.title)
                    Text("\(experiment.streak)")
                        .font(.largeTitle.bold())
                }
                
                Text(experiment.title)
                    .font(.caption)
                    .lineLimit(1)
                
                Text("day streak")
                    .font(.caption2)
                    .foregroundStyle(.secondary)
            }
            .padding()
            .widgetURL(URL(string: "experiments://experiment/\(experiment.id.uuidString)"))
        } else {
            Text("No experiments")
                .font(.caption)
                .foregroundStyle(.secondary)
        }
    }
}

// MARK: - Widget Definitions

struct ProgressWidget: Widget {
    let kind: String = "ProgressWidget"
    
    var body: some WidgetConfiguration {
        AppIntentConfiguration(
            kind: kind,
            intent: ConfigurationAppIntent.self,
            provider: Provider()
        ) { entry in
            ProgressWidgetView(entry: entry)
                .containerBackground(.fill.tertiary, for: .widget)
        }
        .configurationDisplayName("Progress")
        .description("Shows your experiment progress.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

struct StreakWidget: Widget {
    let kind: String = "StreakWidget"
    
    var body: some WidgetConfiguration {
        AppIntentConfiguration(
            kind: kind,
            intent: ConfigurationAppIntent.self,
            provider: Provider()
        ) { entry in
            StreakWidgetView(entry: entry)
                .containerBackground(.fill.tertiary, for: .widget)
        }
        .configurationDisplayName("Streak")
        .description("Shows your current streak.")
        .supportedFamilies([.systemSmall])
    }
}

// MARK: - Widget Bundle

@main
struct ExperimentsWidgetBundle: WidgetBundle {
    var body: some Widget {
        ProgressWidget()
        StreakWidget()
    }
}
