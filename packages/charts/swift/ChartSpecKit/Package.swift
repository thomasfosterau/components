// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "ChartSpecKit",
    platforms: [
        .iOS(.v16),
        .macOS(.v13),
        .watchOS(.v9),
        .tvOS(.v16),
    ],
    products: [
        // The portable chart spec decoder: Codable structs mirroring
        // schema/chart-spec.v1.json. This is the only cross-language contract.
        .library(name: "ChartSpec", targets: ["ChartSpec"]),
        // A SwiftUI renderer built on Apple's Swift Charts framework.
        // Deliberately a separate product: swap it for any other renderer
        // without touching the spec decoder.
        .library(name: "ChartSpecCharts", targets: ["ChartSpecCharts"]),
    ],
    targets: [
        .target(name: "ChartSpec", path: "Sources/ChartSpec"),
        .target(
            name: "ChartSpecCharts",
            dependencies: ["ChartSpec"],
            path: "Sources/ChartSpecCharts"
        ),
        .testTarget(
            name: "ChartSpecTests",
            dependencies: ["ChartSpec"],
            path: "Tests/ChartSpecTests"
        ),
    ]
)
