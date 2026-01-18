//
//  ExperimentDetailView.swift
//  Experiments
//
//  Detail view for a single experiment.
//

import SwiftUI
import SwiftData

/// Detail view showing experiment progress, entries, and actions.
struct ExperimentDetailView: View {
    
    @Environment(\.modelContext) private var modelContext
    @Environment(\.dismiss) private var dismiss
    
    @Bindable var experiment: Experiment
    
    @State private var selectedSection: DetailSection = .entries
    @State private var showingCheckIn = false
    @State private var showingEdit = false
    @State private var showingReflection = false
    @State private var showingShareSheet = false
    
    enum DetailSection: String, CaseIterable {
        case entries = "Entries"
        case calendar = "Calendar"
        case insights = "Insights"
    }
    
    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                // MARK: - Header
                headerSection
                
                // MARK: - Segmented Picker
                sectionPicker
                
                // MARK: - Content
                switch selectedSection {
                case .entries:
                    entriesSection
                case .calendar:
                    calendarSection
                case .insights:
                    insightsSection
                }
            }
            .padding(.horizontal, 20)
        }
        .background(Color(.systemGray6))
        .navigationTitle("")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Menu {
                    Button("Edit", systemImage: "pencil") {
                        showingEdit = true
                    }
                    Button("Share", systemImage: "square.and.arrow.up") {
                        showingShareSheet = true
                    }
                    Button("Reflect", systemImage: "lightbulb") {
                        showingReflection = true
                    }
                    Divider()
                    Button("Archive", systemImage: "archivebox", role: .destructive) {
                        experiment.status = .archived
                        dismiss()
                    }
                } label: {
                    Image(systemName: "ellipsis.circle")
                }
            }
        }
        .sheet(isPresented: $showingCheckIn) {
            CheckInView(experiment: experiment)
        }
        .sheet(isPresented: $showingEdit) {
            ExperimentEditView(mode: .edit(experiment))
        }
        .sheet(isPresented: $showingReflection) {
            ReflectionEditView(experiment: experiment)
        }
    }
    
    // MARK: - Header Section
    
    private var headerSection: some View {
        VStack(spacing: 20) {
            // Progress Ring (Large)
            ProgressRingView(
                progress: experiment.progressPercentage,
                size: 120,
                lineWidth: 8
            )
            
            // Title & Purpose
            VStack(spacing: 8) {
                Text(experiment.title)
                    .font(.title.bold())
                    .multilineTextAlignment(.center)
                
                Text(experiment.purpose)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
            }
            
            // Stats Row
            HStack(spacing: 32) {
                StatItem(value: "\(experiment.currentStreak)", label: "Streak", icon: "flame.fill")
                StatItem(value: "\(experiment.daysCompleted)", label: "Done", icon: "checkmark.circle")
                StatItem(value: "\(experiment.daysRemaining)", label: "Left", icon: "clock")
            }
            
            // Check In Button
            Button {
                showingCheckIn = true
            } label: {
                Text("Check In")
                    .font(.headline)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 16)
                    .background(Color.primary)
                    .foregroundStyle(Color(.systemBackground))
                    .clipShape(RoundedRectangle(cornerRadius: 16))
            }
        }
        .padding(24)
        .background(Color.white)
        .clipShape(RoundedRectangle(cornerRadius: 24))
        .padding(.top, 20)
    }
    
    // MARK: - Section Picker
    
    private var sectionPicker: some View {
        HStack(spacing: 0) {
            ForEach(DetailSection.allCases, id: \.self) { section in
                Button {
                    withAnimation(.easeInOut(duration: 0.2)) {
                        selectedSection = section
                    }
                } label: {
                    Text(section.rawValue)
                        .font(.subheadline.weight(.medium))
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 12)
                        .background(selectedSection == section ? Color.primary : Color.clear)
                        .foregroundStyle(selectedSection == section ? Color(.systemBackground) : .primary)
                }
            }
        }
        .background(Color(.systemGray5))
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }
    
    // MARK: - Entries Section
    
    private var entriesSection: some View {
        VStack(spacing: 12) {
            let sortedEntries = experiment.entries.sorted { $0.scheduledDate > $1.scheduledDate }
            
            if sortedEntries.isEmpty {
                emptyEntriesView
            } else {
                ForEach(sortedEntries) { entry in
                    NavigationLink(destination: EntryDetailView(entry: entry)) {
                        EntryRowView(entry: entry)
                    }
                    .buttonStyle(.plain)
                }
            }
        }
    }
    
    private var emptyEntriesView: some View {
        VStack(spacing: 12) {
            Image(systemName: "tray")
                .font(.largeTitle)
                .foregroundStyle(.secondary)
            Text("No entries yet")
                .font(.headline)
            Text("Check in to record your first entry.")
                .font(.subheadline)
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity)
        .padding(40)
        .background(Color.white)
        .clipShape(RoundedRectangle(cornerRadius: 24))
    }
    
    // MARK: - Calendar Section
    
    private var calendarSection: some View {
        CalendarGridView(experiment: experiment)
            .padding(20)
            .background(Color.white)
            .clipShape(RoundedRectangle(cornerRadius: 24))
    }
    
    // MARK: - Insights Section
    
    private var insightsSection: some View {
        VStack(spacing: 16) {
            InsightCard(
                title: "Completion Rate",
                value: String(format: "%.0f%%", StreakCalculator.completionRate(for: experiment)),
                icon: "chart.pie"
            )
            
            InsightCard(
                title: "Best Streak",
                value: "\(experiment.currentStreak) days",
                icon: "flame"
            )
            
            InsightCard(
                title: "Total Reflections",
                value: "\(experiment.reflections.count)",
                icon: "lightbulb"
            )
        }
    }
}

// MARK: - Stat Item

struct StatItem: View {
    let value: String
    let label: String
    let icon: String
    
    var body: some View {
        VStack(spacing: 4) {
            HStack(spacing: 4) {
                Image(systemName: icon)
                    .font(.caption)
                Text(value)
                    .font(.title3.bold())
            }
            Text(label)
                .font(.caption)
                .foregroundStyle(.secondary)
        }
    }
}

// MARK: - Insight Card

struct InsightCard: View {
    let title: String
    let value: String
    let icon: String
    
    var body: some View {
        HStack {
            Image(systemName: icon)
                .font(.title2)
                .frame(width: 44)
            
            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                Text(value)
                    .font(.title3.bold())
            }
            
            Spacer()
        }
        .padding(16)
        .background(Color.white)
        .clipShape(RoundedRectangle(cornerRadius: 16))
    }
}

#Preview {
    NavigationStack {
        ExperimentDetailView(
            experiment: Experiment(
                title: "30 Days of Meditation",
                purpose: "Reduce stress and improve focus",
                durationDays: 30
            )
        )
    }
    .modelContainer(for: [Experiment.self], inMemory: true)
}
