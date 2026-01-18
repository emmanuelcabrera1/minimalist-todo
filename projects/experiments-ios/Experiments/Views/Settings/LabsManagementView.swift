//
//  LabsManagementView.swift
//  Experiments
//
//  Manage labs (categories) for experiments.
//

import SwiftUI
import SwiftData

/// View for managing labs (categories).
struct LabsManagementView: View {
    
    @Environment(\.modelContext) private var modelContext
    @Environment(\.dismiss) private var dismiss
    
    @Query(sort: \Lab.sortOrder) private var labs: [Lab]
    
    @State private var showingAddLab = false
    @State private var newLabName = ""
    
    var body: some View {
        NavigationStack {
            List {
                ForEach(labs) { lab in
                    HStack {
                        Circle()
                            .fill(Color(hex: lab.colorHex) ?? .primary)
                            .frame(width: 24, height: 24)
                        
                        Text(lab.name)
                        
                        Spacer()
                        
                        Text("\(lab.experiments.count)")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                }
                .onDelete(perform: deleteLabs)
                .onMove(perform: moveLabs)
                
                Button {
                    showingAddLab = true
                } label: {
                    Label("Add Lab", systemImage: "plus")
                }
            }
            .navigationTitle("Labs")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    EditButton()
                }
                
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Done") {
                        dismiss()
                    }
                }
            }
            .alert("New Lab", isPresented: $showingAddLab) {
                TextField("Lab Name", text: $newLabName)
                Button("Cancel", role: .cancel) {
                    newLabName = ""
                }
                Button("Add") {
                    addLab()
                }
            }
        }
    }
    
    private func addLab() {
        let lab = Lab(
            name: newLabName.trimmingCharacters(in: .whitespaces),
            sortOrder: labs.count
        )
        modelContext.insert(lab)
        newLabName = ""
    }
    
    private func deleteLabs(at offsets: IndexSet) {
        for index in offsets {
            modelContext.delete(labs[index])
        }
    }
    
    private func moveLabs(from source: IndexSet, to destination: Int) {
        var reorderedLabs = labs
        reorderedLabs.move(fromOffsets: source, toOffset: destination)
        
        for (index, lab) in reorderedLabs.enumerated() {
            lab.sortOrder = index
        }
    }
}

// MARK: - Color Extension

extension Color {
    init?(hex: String) {
        var hexSanitized = hex.trimmingCharacters(in: .whitespacesAndNewlines)
        hexSanitized = hexSanitized.replacingOccurrences(of: "#", with: "")
        
        guard hexSanitized.count == 6 else { return nil }
        
        var rgb: UInt64 = 0
        Scanner(string: hexSanitized).scanHexInt64(&rgb)
        
        let r = Double((rgb & 0xFF0000) >> 16) / 255.0
        let g = Double((rgb & 0x00FF00) >> 8) / 255.0
        let b = Double(rgb & 0x0000FF) / 255.0
        
        self.init(red: r, green: g, blue: b)
    }
}

#Preview {
    LabsManagementView()
        .modelContainer(for: [Lab.self], inMemory: true)
}
