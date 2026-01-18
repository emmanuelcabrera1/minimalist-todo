//
//  ContentView.swift
//  Experiments
//
//  Root tab bar view for navigation.
//

import SwiftUI

/// Main content view with tab bar navigation.
struct ContentView: View {
    
    @State private var selectedTab: Tab = .experiments
    @State private var navigationPath = NavigationPath()
    
    enum Tab: Hashable {
        case experiments
        case gallery
        case settings
    }
    
    var body: some View {
        TabView(selection: $selectedTab) {
            NavigationStack(path: $navigationPath) {
                ExperimentsListView()
            }
            .tabItem {
                Label("Experiments", systemImage: selectedTab == .experiments ? "flask.fill" : "flask")
            }
            .tag(Tab.experiments)
            
            NavigationStack {
                GalleryListView()
            }
            .tabItem {
                Label("Gallery", systemImage: selectedTab == .gallery ? "sparkles.rectangle.stack.fill" : "sparkles.rectangle.stack")
            }
            .tag(Tab.gallery)
            
            NavigationStack {
                SettingsView()
            }
            .tabItem {
                Label("Settings", systemImage: selectedTab == .settings ? "gearshape.fill" : "gearshape")
            }
            .tag(Tab.settings)
        }
        .tint(.primary) // Monochrome accent
    }
}

#Preview {
    ContentView()
        .modelContainer(for: [Experiment.self, Lab.self], inMemory: true)
}
