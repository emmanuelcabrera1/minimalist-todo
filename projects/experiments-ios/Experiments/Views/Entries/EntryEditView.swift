//
//  EntryEditView.swift
//  Experiments
//
//  Edit view for modifying entries.
//

import SwiftUI
import PhotosUI

/// Modal for editing an existing entry.
struct EntryEditView: View {
    
    @Environment(\.dismiss) private var dismiss
    
    @Bindable var entry: Entry
    
    @State private var isCompleted: Bool = true
    @State private var noteText: String = ""
    @State private var selectedPhoto: PhotosPickerItem?
    @State private var photoData: Data?
    
    var body: some View {
        NavigationStack {
            Form {
                Section("Status") {
                    Picker("Completed?", selection: $isCompleted) {
                        Text("Completed ✓").tag(true)
                        Text("Missed ✗").tag(false)
                    }
                    .pickerStyle(.segmented)
                }
                
                Section("Note") {
                    TextField("How did it go?", text: $noteText, axis: .vertical)
                        .lineLimit(3...6)
                }
                
                Section("Photo") {
                    PhotosPicker(selection: $selectedPhoto, matching: .images) {
                        Label("Change Photo", systemImage: "photo")
                    }
                    
                    if let photoData, let uiImage = UIImage(data: photoData) {
                        Image(uiImage: uiImage)
                            .resizable()
                            .aspectRatio(contentMode: .fit)
                            .frame(maxHeight: 200)
                            .clipShape(RoundedRectangle(cornerRadius: 12))
                    }
                }
            }
            .navigationTitle("Edit Entry")
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
                    .fontWeight(.semibold)
                }
            }
            .onAppear {
                isCompleted = entry.isCompleted
                noteText = entry.noteText ?? ""
            }
            .onChange(of: selectedPhoto) { _, newValue in
                Task {
                    if let data = try? await newValue?.loadTransferable(type: Data.self) {
                        photoData = data
                    }
                }
            }
        }
    }
    
    private func save() {
        entry.isCompleted = isCompleted
        entry.noteText = noteText.isEmpty ? nil : noteText
        entry.updatedAt = Date()
        dismiss()
    }
}

#Preview {
    EntryEditView(
        entry: Entry(
            scheduledDate: Date().toLocalDateString(),
            isCompleted: true,
            noteText: "Great!"
        )
    )
    .modelContainer(for: [Entry.self], inMemory: true)
}
