//
//  SettingsView.swift
//  Experiments
//
//  App settings and preferences.
//

import SwiftUI

/// Settings view with app configuration and links.
struct SettingsView: View {
    
    @State private var showingLabsManagement = false
    @State private var showingProUpgrade = false
    @State private var showingImport = false
    
    var body: some View {
        List {
            // MARK: - Profile Section
            Section {
                HStack(spacing: 16) {
                    Circle()
                        .fill(Color(.systemGray5))
                        .frame(width: 60, height: 60)
                        .overlay {
                            Image(systemName: "person.fill")
                                .font(.title2)
                                .foregroundStyle(.secondary)
                        }
                    
                    VStack(alignment: .leading, spacing: 4) {
                        Text("Experimenter")
                            .font(.headline)
                        
                        Text("Free Plan")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                    }
                    
                    Spacer()
                    
                    Button("Upgrade") {
                        showingProUpgrade = true
                    }
                    .font(.caption.weight(.semibold))
                    .padding(.horizontal, 12)
                    .padding(.vertical, 6)
                    .background(Color.primary)
                    .foregroundStyle(Color(.systemBackground))
                    .clipShape(Capsule())
                }
            }
            
            // MARK: - Sync Status
            Section("iCloud Sync") {
                HStack {
                    Image(systemName: "icloud.fill")
                        .foregroundStyle(.blue)
                    Text("Syncing Enabled")
                    Spacer()
                    Image(systemName: "checkmark.circle.fill")
                        .foregroundStyle(.green)
                }
            }
            
            // MARK: - Organization
            Section("Organization") {
                Button {
                    showingLabsManagement = true
                } label: {
                    Label("Manage Labs", systemImage: "folder")
                }
                
                NavigationLink {
                    ArchivedExperimentsView()
                } label: {
                    Label("Archived Experiments", systemImage: "archivebox")
                }
            }
            
            // MARK: - Data
            Section("Data") {
                Button {
                    showingImport = true
                } label: {
                    Label("Import Experiment", systemImage: "square.and.arrow.down")
                }
                
                NavigationLink {
                    Text("Export Help Screen")
                } label: {
                    Label("Export Help", systemImage: "questionmark.circle")
                }
            }
            
            // MARK: - About
            Section("About") {
                HStack {
                    Text("Version")
                    Spacer()
                    Text("1.0.0")
                        .foregroundStyle(.secondary)
                }
                
                Link(destination: URL(string: "https://nesslabs.com")!) {
                    Label("Tiny Experiments by Anne-Laure Le Cunff", systemImage: "book")
                }
            }
        }
        .navigationTitle("Settings")
        .sheet(isPresented: $showingLabsManagement) {
            LabsManagementView()
        }
        .sheet(isPresented: $showingProUpgrade) {
            ProUpgradeView()
        }
        .sheet(isPresented: $showingImport) {
            ImportView()
        }
    }
}

// MARK: - Archived Experiments View

struct ArchivedExperimentsView: View {
    @Environment(\.modelContext) private var modelContext
    @Query(filter: #Predicate<Experiment> { $0.status == .archived })
    private var archivedExperiments: [Experiment]
    
    var body: some View {
        List {
            if archivedExperiments.isEmpty {
                ContentUnavailableView(
                    "No Archived Experiments",
                    systemImage: "archivebox",
                    description: Text("Experiments you archive will appear here.")
                )
            } else {
                ForEach(archivedExperiments) { experiment in
                    NavigationLink(destination: ExperimentDetailView(experiment: experiment)) {
                        VStack(alignment: .leading, spacing: 4) {
                            Text(experiment.title)
                                .font(.headline)
                            Text(experiment.purpose)
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                    }
                }
            }
        }
        .navigationTitle("Archived")
    }
}

#Preview {
    NavigationStack {
        SettingsView()
    }
    .modelContainer(for: [Experiment.self, Lab.self], inMemory: true)
}
