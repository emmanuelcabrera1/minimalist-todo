//
//  ExperimentsListView.swift
//  Experiments
//
//  Main list view for experiments (ACT dashboard).
//

import SwiftUI
import SwiftData

/// Main dashboard showing active experiments.
/// Implements the "Monochrome Concept" design with pill filters.
struct ExperimentsListView: View {
    
    @Environment(\.modelContext) private var modelContext
    @Query(filter: #Predicate<Experiment> { $0.status == .active },
           sort: \Experiment.createdAt, order: .reverse)
    private var experiments: [Experiment]
    
    @Query private var labs: [Lab]
    
    @State private var selectedFilter: ExperimentFilter = .all
    @State private var showingCreateSheet = false
    @State private var searchText = ""
    
    enum ExperimentFilter: Hashable {
        case all
        case lab(Lab)
        
        var displayName: String {
            switch self {
            case .all: return "ALL"
            case .lab(let lab): return lab.name.uppercased()
            }
        }
    }
    
    var filteredExperiments: [Experiment] {
        var result = experiments
        
        // Filter by lab
        if case .lab(let lab) = selectedFilter {
            result = result.filter { $0.lab?.id == lab.id }
        }
        
        // Filter by search
        if !searchText.isEmpty {
            result = result.filter {
                $0.title.localizedCaseInsensitiveContains(searchText) ||
                $0.purpose.localizedCaseInsensitiveContains(searchText)
            }
        }
        
        return result
    }
    
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 24) {
                // MARK: - Header
                headerSection
                
                // MARK: - Filter Pills
                filterPillsSection
                
                // MARK: - Experiments List
                if filteredExperiments.isEmpty {
                    emptyStateView
                } else {
                    experimentsListSection
                }
            }
            .padding(.horizontal, 20)
        }
        .background(Color(.systemGray6))
        .navigationTitle("")
        .navigationBarHidden(true)
        .sheet(isPresented: $showingCreateSheet) {
            ExperimentEditView(mode: .create)
        }
    }
    
    // MARK: - Header Section
    
    private var headerSection: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("Today")
                .font(.system(size: 48, weight: .bold, design: .default))
                .foregroundStyle(.primary)
            
            Text(Date().formatted(.dateTime.weekday(.wide).day().month(.abbreviated)).uppercased())
                .font(.system(size: 14, weight: .medium))
                .foregroundStyle(.secondary)
                .tracking(1.5)
        }
        .padding(.top, 60)
    }
    
    // MARK: - Filter Pills
    
    private var filterPillsSection: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 12) {
                // "All" pill
                FilterPill(
                    title: "ALL",
                    isSelected: selectedFilter == .all
                ) {
                    selectedFilter = .all
                }
                
                // Lab pills
                ForEach(labs) { lab in
                    FilterPill(
                        title: lab.name.uppercased(),
                        isSelected: {
                            if case .lab(let selectedLab) = selectedFilter {
                                return selectedLab.id == lab.id
                            }
                            return false
                        }()
                    ) {
                        selectedFilter = .lab(lab)
                    }
                }
            }
        }
    }
    
    // MARK: - Experiments List
    
    private var experimentsListSection: some View {
        VStack(spacing: 16) {
            ForEach(filteredExperiments) { experiment in
                NavigationLink(destination: ExperimentDetailView(experiment: experiment)) {
                    ExperimentRowView(experiment: experiment)
                }
                .buttonStyle(.plain)
            }
        }
    }
    
    // MARK: - Empty State
    
    private var emptyStateView: some View {
        VStack(spacing: 16) {
            RoundedRectangle(cornerRadius: 24)
                .fill(Color.white)
                .frame(height: 200)
                .overlay {
                    VStack(spacing: 12) {
                        Text("Idle Station")
                            .font(.title2.bold())
                        
                        Text("No active protocols running.")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                    }
                }
        }
        .padding(.top, 20)
    }
}

// MARK: - Filter Pill Component

struct FilterPill: View {
    let title: String
    let isSelected: Bool
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            Text(title)
                .font(.system(size: 14, weight: .semibold))
                .padding(.horizontal, 20)
                .padding(.vertical, 10)
                .background(isSelected ? Color.primary : Color(.systemGray5))
                .foregroundStyle(isSelected ? Color(.systemBackground) : .primary)
                .clipShape(Capsule())
        }
    }
}

#Preview {
    NavigationStack {
        ExperimentsListView()
    }
    .modelContainer(for: [Experiment.self, Lab.self], inMemory: true)
}
