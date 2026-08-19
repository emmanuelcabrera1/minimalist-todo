//
//  ExperimentsApp.swift
//  Experiments
//
//  A life experiments tracker using the Tiny Experiments Framework.
//

import SwiftUI
import SwiftData

/// Main entry point for the Experiments app.
/// Configures SwiftData model container with CloudKit sync.
@main
struct ExperimentsApp: App {
    
    /// Shared model container for SwiftData persistence.
    /// Uses CloudKit automatic sync when user is signed in.
    let modelContainer: ModelContainer
    
    init() {
        do {
            let schema = Schema([
                Lab.self,
                Experiment.self,
                Entry.self,
                Reminder.self,
                Reflection.self
            ])
            
            let modelConfiguration = ModelConfiguration(
                schema: schema,
                isStoredInMemoryOnly: false,
                cloudKitDatabase: .automatic
            )
            
            modelContainer = try ModelContainer(
                for: schema,
                configurations: [modelConfiguration]
            )
        } catch {
            fatalError("Failed to create ModelContainer: \(error)")
        }
    }
    
    var body: some Scene {
        WindowGroup {
            ContentView()
                .environment(\.modelContext, modelContainer.mainContext)
        }
        .modelContainer(modelContainer)
    }
}
