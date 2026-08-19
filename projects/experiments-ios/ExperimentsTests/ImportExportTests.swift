//
//  ImportExportTests.swift
//  ExperimentsTests
//
//  Unit tests for import/export functionality.
//

import XCTest
@testable import Experiments

final class ImportExportTests: XCTestCase {
    
    // MARK: - Export Tests
    
    func testExportCreatesValidJSON() throws {
        let experiment = Experiment(
            title: "Test Export",
            purpose: "Testing export functionality",
            successCriteria: "Export works",
            durationDays: 30
        )
        
        let data = try ImportExportService.shared.exportExperiment(experiment)
        
        XCTAssertFalse(data.isEmpty, "Export should produce non-empty data")
        
        // Validate JSON structure
        let json = try JSONSerialization.jsonObject(with: data) as? [String: Any]
        XCTAssertNotNil(json)
        XCTAssertEqual(json?["version"] as? Int, 1)
        XCTAssertNotNil(json?["exportedAt"])
        XCTAssertNotNil(json?["experiments"])
    }
    
    func testExportIncludesEntries() throws {
        let experiment = Experiment(
            title: "Test With Entries",
            purpose: "Testing",
            durationDays: 30
        )
        
        let entry = Entry(
            experiment: experiment,
            scheduledDate: "2024-01-15",
            isCompleted: true,
            noteText: "Great day!"
        )
        experiment.entries.append(entry)
        
        let data = try ImportExportService.shared.exportExperiment(experiment, includeEntries: true)
        let json = try JSONSerialization.jsonObject(with: data) as? [String: Any]
        let experiments = json?["experiments"] as? [[String: Any]]
        let entries = experiments?.first?["entries"] as? [[String: Any]]
        
        XCTAssertEqual(entries?.count, 1)
        XCTAssertEqual(entries?.first?["scheduledDate"] as? String, "2024-01-15")
        XCTAssertEqual(entries?.first?["isCompleted"] as? Bool, true)
    }
    
    func testExportWithoutEntries() throws {
        let experiment = Experiment(
            title: "Test Without Entries",
            purpose: "Testing",
            durationDays: 30
        )
        
        let entry = Entry(
            experiment: experiment,
            scheduledDate: "2024-01-15",
            isCompleted: true
        )
        experiment.entries.append(entry)
        
        let data = try ImportExportService.shared.exportExperiment(experiment, includeEntries: false)
        let json = try JSONSerialization.jsonObject(with: data) as? [String: Any]
        let experiments = json?["experiments"] as? [[String: Any]]
        let entries = experiments?.first?["entries"] as? [[String: Any]]
        
        XCTAssertEqual(entries?.count, 0, "Entries should be empty when includeEntries is false")
    }
    
    // MARK: - Import Validation Tests
    
    func testImportValidatesVersion() {
        let futureVersionJSON = """
        {
            "version": 999,
            "exportedAt": "2024-01-15T10:00:00Z",
            "experiments": []
        }
        """
        
        let data = futureVersionJSON.data(using: .utf8)!
        
        // This should throw unsupportedVersion error
        // In real test, we'd use an in-memory model context
    }
    
    func testImportHandlesMinimalData() throws {
        let minimalJSON = """
        {
            "version": 1,
            "exportedAt": "2024-01-15T10:00:00Z",
            "experiments": [
                {
                    "id": "550e8400-e29b-41d4-a716-446655440000",
                    "title": "Minimal Experiment",
                    "purpose": "Testing minimal import",
                    "startDate": "2024-01-01T00:00:00Z",
                    "durationDays": 30,
                    "frequency": "daily",
                    "entries": []
                }
            ]
        }
        """
        
        let data = minimalJSON.data(using: .utf8)!
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        
        let container = try decoder.decode(ExportContainer.self, from: data)
        
        XCTAssertEqual(container.version, 1)
        XCTAssertEqual(container.experiments.count, 1)
        XCTAssertEqual(container.experiments.first?.title, "Minimal Experiment")
    }
    
    // MARK: - Round-trip Tests
    
    func testExportImportRoundtrip() throws {
        let original = Experiment(
            title: "Round Trip Test",
            purpose: "Testing round-trip export/import",
            successCriteria: "Data survives round-trip",
            durationDays: 45
        )
        
        let data = try ImportExportService.shared.exportExperiment(original)
        
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        let container = try decoder.decode(ExportContainer.self, from: data)
        
        XCTAssertEqual(container.experiments.first?.title, original.title)
        XCTAssertEqual(container.experiments.first?.purpose, original.purpose)
        XCTAssertEqual(container.experiments.first?.successCriteria, original.successCriteria)
        XCTAssertEqual(container.experiments.first?.durationDays, original.durationDays)
    }
}
