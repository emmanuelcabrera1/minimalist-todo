//
//  ExperimentEditView.swift
//  Experiments
//
//  Create/Edit form implementing the PACT framework.
//

import SwiftUI
import SwiftData

/// Form for creating or editing an experiment.
/// Structured around the PACT framework:
/// - P: Purpose
/// - A: Action (Title)
/// - C: Continuous (Frequency)
/// - T: Trackable (Success Criteria)
struct ExperimentEditView: View {
    
    enum Mode {
        case create
        case edit(Experiment)
        case fromTemplate(ExperimentTemplate)
    }
    
    @Environment(\.modelContext) private var modelContext
    @Environment(\.dismiss) private var dismiss
    
    @Query private var labs: [Lab]
    
    let mode: Mode
    
    // MARK: - Form State
    
    @State private var title: String = ""
    @State private var purpose: String = ""
    @State private var successCriteria: String = ""
    @State private var durationDays: Int = 30
    @State private var frequency: ExperimentFrequency = .daily
    @State private var customFrequencyDays: Int = 2
    @State private var selectedLab: Lab?
    @State private var startDate: Date = Date()
    
    private var isValid: Bool {
        !title.trimmingCharacters(in: .whitespaces).isEmpty &&
        !purpose.trimmingCharacters(in: .whitespaces).isEmpty
    }
    
    var body: some View {
        NavigationStack {
            Form {
                // MARK: - PACT Section
                Section {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("Make a PACT")
                            .font(.headline)
                        Text("Purposeful • Actionable • Continuous • Trackable")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                    .listRowBackground(Color.clear)
                    .listRowInsets(EdgeInsets())
                }
                
                // MARK: - Purpose (P)
                Section("Purpose — Why are you doing this?") {
                    TextField("e.g., Reduce stress and feel calmer", text: $purpose, axis: .vertical)
                        .lineLimit(2...4)
                }
                
                // MARK: - Action (A)
                Section("Action — What will you do?") {
                    TextField("e.g., Meditate for 10 minutes", text: $title)
                }
                
                // MARK: - Continuous (C)
                Section("Continuous — How often?") {
                    Picker("Frequency", selection: $frequency) {
                        ForEach(ExperimentFrequency.allCases, id: \.self) { freq in
                            Text(freq.displayName).tag(freq)
                        }
                    }
                    .pickerStyle(.segmented)
                    
                    if frequency == .custom {
                        Stepper("Every \(customFrequencyDays) days", value: $customFrequencyDays, in: 2...30)
                    }
                    
                    Stepper("Duration: \(durationDays) days", value: $durationDays, in: 7...365)
                    
                    DatePicker("Start Date", selection: $startDate, displayedComponents: .date)
                }
                
                // MARK: - Trackable (T)
                Section("Trackable — How will you measure success?") {
                    TextField("e.g., Complete morning session before 8 AM", text: $successCriteria, axis: .vertical)
                        .lineLimit(2...4)
                }
                
                // MARK: - Organization
                Section("Lab (Optional)") {
                    Picker("Lab", selection: $selectedLab) {
                        Text("None").tag(nil as Lab?)
                        ForEach(labs) { lab in
                            Text(lab.name).tag(lab as Lab?)
                        }
                    }
                }
            }
            .navigationTitle(navigationTitle)
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
                
                ToolbarItem(placement: .confirmationAction) {
                    Button(saveButtonTitle) {
                        save()
                    }
                    .disabled(!isValid)
                    .fontWeight(.semibold)
                }
            }
            .onAppear {
                loadInitialData()
            }
        }
    }
    
    private var navigationTitle: String {
        switch mode {
        case .create, .fromTemplate: return "New Experiment"
        case .edit: return "Edit Experiment"
        }
    }
    
    private var saveButtonTitle: String {
        switch mode {
        case .create, .fromTemplate: return "Start"
        case .edit: return "Save"
        }
    }
    
    private func loadInitialData() {
        switch mode {
        case .create:
            break
            
        case .edit(let experiment):
            title = experiment.title
            purpose = experiment.purpose
            successCriteria = experiment.successCriteria ?? ""
            durationDays = experiment.durationDays
            frequency = experiment.frequency
            customFrequencyDays = experiment.customFrequencyDays ?? 2
            selectedLab = experiment.lab
            startDate = experiment.startDate
            
        case .fromTemplate(let template):
            title = template.title
            purpose = template.purpose
            successCriteria = template.successCriteria ?? ""
            durationDays = template.durationDays
            frequency = template.frequency
        }
    }
    
    private func save() {
        switch mode {
        case .create, .fromTemplate:
            let experiment = Experiment(
                title: title.trimmingCharacters(in: .whitespaces),
                purpose: purpose.trimmingCharacters(in: .whitespaces),
                successCriteria: successCriteria.isEmpty ? nil : successCriteria.trimmingCharacters(in: .whitespaces),
                startDate: startDate,
                durationDays: durationDays,
                frequency: frequency,
                customFrequencyDays: frequency == .custom ? customFrequencyDays : nil,
                lab: selectedLab
            )
            modelContext.insert(experiment)
            
        case .edit(let experiment):
            experiment.title = title.trimmingCharacters(in: .whitespaces)
            experiment.purpose = purpose.trimmingCharacters(in: .whitespaces)
            experiment.successCriteria = successCriteria.isEmpty ? nil : successCriteria.trimmingCharacters(in: .whitespaces)
            experiment.startDate = startDate
            experiment.durationDays = durationDays
            experiment.frequency = frequency
            experiment.customFrequencyDays = frequency == .custom ? customFrequencyDays : nil
            experiment.lab = selectedLab
            experiment.updatedAt = Date()
        }
        
        dismiss()
    }
}

#Preview("Create") {
    ExperimentEditView(mode: .create)
        .modelContainer(for: [Experiment.self, Lab.self], inMemory: true)
}
