//
//  ImportView.swift
//  Experiments
//
//  Import experiments from JSON files.
//

import SwiftUI
import UniformTypeIdentifiers

/// View for importing experiments from JSON files.
struct ImportView: View {
    
    @Environment(\.modelContext) private var modelContext
    @Environment(\.dismiss) private var dismiss
    
    @State private var showingFilePicker = false
    @State private var importResult: ImportResult?
    @State private var showingResult = false
    
    enum ImportResult {
        case success(count: Int)
        case error(String)
    }
    
    var body: some View {
        NavigationStack {
            VStack(spacing: 32) {
                Spacer()
                
                Image(systemName: "square.and.arrow.down")
                    .font(.system(size: 60))
                    .foregroundStyle(.secondary)
                
                VStack(spacing: 12) {
                    Text("Import Experiments")
                        .font(.title2.bold())
                    
                    Text("Select a .json file exported from Experiments.")
                        .font(.subheadline)
                        .foregroundStyle(.secondary)
                        .multilineTextAlignment(.center)
                }
                
                Button {
                    showingFilePicker = true
                } label: {
                    Text("Choose File")
                        .font(.headline)
                        .padding(.horizontal, 32)
                        .padding(.vertical, 16)
                        .background(Color.primary)
                        .foregroundStyle(Color(.systemBackground))
                        .clipShape(RoundedRectangle(cornerRadius: 16))
                }
                
                Spacer()
            }
            .padding(24)
            .navigationTitle("Import")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
            }
            .fileImporter(
                isPresented: $showingFilePicker,
                allowedContentTypes: [.json]
            ) { result in
                handleFileImport(result)
            }
            .alert("Import Result", isPresented: $showingResult) {
                Button("OK") {
                    if case .success = importResult {
                        dismiss()
                    }
                }
            } message: {
                switch importResult {
                case .success(let count):
                    Text("Successfully imported \(count) experiment(s).")
                case .error(let message):
                    Text("Error: \(message)")
                case .none:
                    Text("")
                }
            }
        }
    }
    
    private func handleFileImport(_ result: Result<URL, Error>) {
        do {
            let url = try result.get()
            
            guard url.startAccessingSecurityScopedResource() else {
                importResult = .error("Could not access file.")
                showingResult = true
                return
            }
            
            defer { url.stopAccessingSecurityScopedResource() }
            
            let data = try Data(contentsOf: url)
            let count = try ImportExportService.shared.importExperiments(from: data, into: modelContext)
            
            importResult = .success(count: count)
            showingResult = true
            
        } catch {
            importResult = .error(error.localizedDescription)
            showingResult = true
        }
    }
}

#Preview {
    ImportView()
        .modelContainer(for: [Experiment.self], inMemory: true)
}
