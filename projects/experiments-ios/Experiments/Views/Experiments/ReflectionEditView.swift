//
//  ReflectionEditView.swift
//  Experiments
//
//  Form for creating reflections (REACT phase).
//

import SwiftUI

/// Modal for creating a reflection with Plus-Minus-Next format.
struct ReflectionEditView: View {
    
    @Environment(\.modelContext) private var modelContext
    @Environment(\.dismiss) private var dismiss
    
    let experiment: Experiment
    
    @State private var plusLog = ""
    @State private var minusLog = ""
    @State private var nextSteps = ""
    @State private var decision: ReflectionDecision = .persist
    
    private var isValid: Bool {
        !plusLog.trimmingCharacters(in: .whitespaces).isEmpty
    }
    
    var body: some View {
        NavigationStack {
            Form {
                Section {
                    VStack(alignment: .leading, spacing: 4) {
                        Text("Time to REACT")
                            .font(.headline)
                        Text("Reflect on your experiment using Plus-Minus-Next")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                    .listRowBackground(Color.clear)
                }
                
                // MARK: - Plus
                Section {
                    VStack(alignment: .leading, spacing: 8) {
                        Label("Plus (+)", systemImage: "plus.circle.fill")
                            .font(.subheadline.bold())
                            .foregroundStyle(.green)
                        
                        TextField("What went well?", text: $plusLog, axis: .vertical)
                            .lineLimit(3...6)
                    }
                }
                
                // MARK: - Minus
                Section {
                    VStack(alignment: .leading, spacing: 8) {
                        Label("Minus (−)", systemImage: "minus.circle.fill")
                            .font(.subheadline.bold())
                            .foregroundStyle(.red)
                        
                        TextField("What was difficult?", text: $minusLog, axis: .vertical)
                            .lineLimit(3...6)
                    }
                }
                
                // MARK: - Next
                Section {
                    VStack(alignment: .leading, spacing: 8) {
                        Label("Next (→)", systemImage: "arrow.right.circle.fill")
                            .font(.subheadline.bold())
                            .foregroundStyle(.blue)
                        
                        TextField("What will you do differently?", text: $nextSteps, axis: .vertical)
                            .lineLimit(3...6)
                    }
                }
                
                // MARK: - Decision
                Section("Decision") {
                    Picker("What's next?", selection: $decision) {
                        ForEach(ReflectionDecision.allCases, id: \.self) { decision in
                            Label(decision.displayName, systemImage: decision.iconName)
                                .tag(decision)
                        }
                    }
                    .pickerStyle(.inline)
                    .labelsHidden()
                }
            }
            .navigationTitle("Reflect")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
                
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
                        save()
                    }
                    .disabled(!isValid)
                    .fontWeight(.semibold)
                }
            }
        }
    }
    
    private func save() {
        let reflection = Reflection(
            experiment: experiment,
            plusLog: plusLog.trimmingCharacters(in: .whitespaces),
            minusLog: minusLog.trimmingCharacters(in: .whitespaces),
            nextSteps: nextSteps.trimmingCharacters(in: .whitespaces),
            decision: decision
        )
        
        modelContext.insert(reflection)
        
        // Apply decision
        switch decision {
        case .persist:
            break // Continue as-is
        case .pivot:
            break // User will edit manually
        case .pause:
            experiment.status = .archived
        }
        
        dismiss()
    }
}

#Preview {
    ReflectionEditView(
        experiment: Experiment(
            title: "Test",
            purpose: "Testing"
        )
    )
    .modelContainer(for: [Experiment.self, Reflection.self], inMemory: true)
}
