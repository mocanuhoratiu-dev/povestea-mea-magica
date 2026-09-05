import AppKit
import AVFoundation
import CoreVideo

struct Slide {
    let image: String
    let kicker: String
    let title: String
}

struct Film {
    let output: String
    let brand: String
    let title: String
    let subtitle: String
    let backgroundTop: NSColor
    let backgroundBottom: NSColor
    let accent: NSColor
    let text: NSColor
    let slides: [Slide]
}

let root = CommandLine.arguments.count > 1 ? CommandLine.arguments[1] : FileManager.default.currentDirectoryPath
let width = 1280
let height = 720
let fps: Int32 = 30
let seconds = 8.0

func cgImage(at path: String) -> CGImage {
    guard let image = NSImage(contentsOfFile: path), let result = image.cgImage(forProposedRect: nil, context: nil, hints: nil) else {
        fatalError("Nu pot încărca \(path)")
    }
    return result
}

func ease(_ value: CGFloat) -> CGFloat {
    let x = min(1, max(0, value))
    return x * x * (3 - 2 * x)
}

func drawText(_ text: String, in rect: CGRect, font: NSFont, color: NSColor, alignment: NSTextAlignment = .left, lineHeight: CGFloat? = nil) {
    let paragraph = NSMutableParagraphStyle()
    paragraph.alignment = alignment
    if let lineHeight { paragraph.minimumLineHeight = lineHeight; paragraph.maximumLineHeight = lineHeight }
    NSAttributedString(string: text, attributes: [.font: font, .foregroundColor: color, .paragraphStyle: paragraph]).draw(with: rect, options: [.usesLineFragmentOrigin, .usesFontLeading])
}

func drawPage(_ image: CGImage, context: CGContext, progress: CGFloat, alpha: CGFloat) {
    let pageHeight: CGFloat = 590
    let ratio = CGFloat(image.width) / CGFloat(image.height)
    let pageWidth = pageHeight * ratio
    let x = 690 + (1 - ease(progress)) * 90
    let y: CGFloat = 64
    context.saveGState()
    context.setAlpha(alpha)
    context.setShadow(offset: CGSize(width: 24, height: 28), blur: 30, color: NSColor.black.withAlphaComponent(0.32).cgColor)
    context.draw(image, in: CGRect(x: x, y: y, width: pageWidth, height: pageHeight))
    context.restoreGState()
}

func makeFrame(film: Film, images: [CGImage], time: Double, buffer: CVPixelBuffer) {
    CVPixelBufferLockBaseAddress(buffer, [])
    defer { CVPixelBufferUnlockBaseAddress(buffer, []) }
    guard let base = CVPixelBufferGetBaseAddress(buffer), let context = CGContext(data: base, width: width, height: height, bitsPerComponent: 8, bytesPerRow: CVPixelBufferGetBytesPerRow(buffer), space: CGColorSpaceCreateDeviceRGB(), bitmapInfo: CGImageAlphaInfo.premultipliedFirst.rawValue | CGBitmapInfo.byteOrder32Little.rawValue) else { return }

    context.translateBy(x: 0, y: CGFloat(height))
    context.scaleBy(x: 1, y: -1)
    let colors = [film.backgroundTop.cgColor, film.backgroundBottom.cgColor] as CFArray
    let gradient = CGGradient(colorsSpace: CGColorSpaceCreateDeviceRGB(), colors: colors, locations: [0, 1])!
    context.drawLinearGradient(gradient, start: .zero, end: CGPoint(x: width, y: height), options: [])
    context.setFillColor(film.accent.withAlphaComponent(0.08).cgColor)
    context.fillEllipse(in: CGRect(x: 720, y: -170, width: 720, height: 720))

    let graphics = NSGraphicsContext(cgContext: context, flipped: true)
    NSGraphicsContext.saveGraphicsState()
    NSGraphicsContext.current = graphics
    defer { NSGraphicsContext.restoreGraphicsState() }

    drawText(film.brand, in: CGRect(x: 70, y: 58, width: 520, height: 28), font: .systemFont(ofSize: 16, weight: .heavy), color: film.accent)
    drawText(film.title, in: CGRect(x: 70, y: 135, width: 530, height: 125), font: .systemFont(ofSize: 52, weight: .black), color: film.text, lineHeight: 57)
    drawText(film.subtitle, in: CGRect(x: 70, y: 275, width: 500, height: 70), font: .systemFont(ofSize: 21, weight: .semibold), color: film.text.withAlphaComponent(0.66), lineHeight: 30)

    let slideDuration = seconds / Double(film.slides.count)
    let index = min(film.slides.count - 1, Int(time / slideDuration))
    let local = (time - Double(index) * slideDuration) / slideDuration
    let slide = film.slides[index]
    let enter = CGFloat(min(1, local / 0.2))
    let leave = CGFloat(local > 0.82 ? max(0, (1 - local) / 0.18) : 1)
    drawPage(images[index], context: context, progress: enter, alpha: leave)

    drawText(slide.kicker.uppercased(), in: CGRect(x: 70, y: 430, width: 500, height: 24), font: .systemFont(ofSize: 13, weight: .black), color: film.accent)
    drawText(slide.title, in: CGRect(x: 70, y: 466, width: 500, height: 70), font: .systemFont(ofSize: 30, weight: .bold), color: film.text, lineHeight: 36)
    context.setFillColor(film.text.withAlphaComponent(0.16).cgColor)
    context.fill(CGRect(x: 70, y: 625, width: 500, height: 2))
    context.setFillColor(film.accent.cgColor)
    context.fill(CGRect(x: 70, y: 625, width: 500 * CGFloat((time + 0.03) / seconds), height: 3))
    drawText("Personalizezi  →  Printezi  →  Folosiți împreună", in: CGRect(x: 70, y: 646, width: 540, height: 24), font: .systemFont(ofSize: 13, weight: .bold), color: film.text.withAlphaComponent(0.54))
}

func render(_ film: Film) throws {
    let outputURL = URL(fileURLWithPath: root).appendingPathComponent(film.output)
    try? FileManager.default.removeItem(at: outputURL)
    try FileManager.default.createDirectory(at: outputURL.deletingLastPathComponent(), withIntermediateDirectories: true)
    let writer = try AVAssetWriter(outputURL: outputURL, fileType: .mp4)
    let settings: [String: Any] = [
        AVVideoCodecKey: AVVideoCodecType.h264,
        AVVideoWidthKey: width,
        AVVideoHeightKey: height,
        AVVideoCompressionPropertiesKey: [AVVideoAverageBitRateKey: 2_400_000, AVVideoProfileLevelKey: AVVideoProfileLevelH264HighAutoLevel]
    ]
    let input = AVAssetWriterInput(mediaType: .video, outputSettings: settings)
    input.expectsMediaDataInRealTime = false
    let adaptor = AVAssetWriterInputPixelBufferAdaptor(assetWriterInput: input, sourcePixelBufferAttributes: [
        kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA,
        kCVPixelBufferWidthKey as String: width,
        kCVPixelBufferHeightKey as String: height
    ])
    guard writer.canAdd(input) else { fatalError("Nu pot configura exportul video") }
    writer.add(input)
    writer.startWriting()
    writer.startSession(atSourceTime: .zero)
    let images = film.slides.map { cgImage(at: URL(fileURLWithPath: root).appendingPathComponent($0.image).path) }
    let frames = Int(seconds * Double(fps))
    for frame in 0..<frames {
        while !input.isReadyForMoreMediaData { Thread.sleep(forTimeInterval: 0.002) }
        var buffer: CVPixelBuffer?
        CVPixelBufferCreate(nil, width, height, kCVPixelFormatType_32BGRA, [
            kCVPixelBufferCGImageCompatibilityKey as String: true,
            kCVPixelBufferCGBitmapContextCompatibilityKey as String: true
        ] as CFDictionary, &buffer)
        guard let buffer else { continue }
        let time = Double(frame) / Double(fps)
        makeFrame(film: film, images: images, time: time, buffer: buffer)
        adaptor.append(buffer, withPresentationTime: CMTime(value: CMTimeValue(frame), timescale: fps))
    }
    input.markAsFinished()
    let semaphore = DispatchSemaphore(value: 0)
    writer.finishWriting { semaphore.signal() }
    semaphore.wait()
    if writer.status != .completed { throw writer.error ?? NSError(domain: "video", code: 1) }
    print("Created \(outputURL.path)")
}

let night = Film(
    output: "public/videos/scutul-de-noapte.mp4",
    brand: "POVESTEA MEA MAGICĂ",
    title: "Un ritual care prinde viață.",
    subtitle: "Nouă pagini personalizate pentru o seară parcursă împreună.",
    backgroundTop: NSColor(calibratedRed: 0.035, green: 0.073, blue: 0.17, alpha: 1),
    backgroundBottom: NSColor(calibratedRed: 0.09, green: 0.12, blue: 0.25, alpha: 1),
    accent: NSColor(calibratedRed: 0.89, green: 0.75, blue: 0.36, alpha: 1),
    text: NSColor(calibratedRed: 0.98, green: 0.95, blue: 0.86, alpha: 1),
    slides: [
        Slide(image: "public/examples/scut/certificat.png", kicker: "01 · Personalizezi", title: "Certificatul poartă numele copilului"),
        Slide(image: "public/examples/scut/reteta.png", kicker: "02 · Printezi", title: "Rețeta deschide jocul de seară"),
        Slide(image: "public/examples/scut/etichete.png", kicker: "03 · Pregătiți", title: "Etichetele transformă ritualul într-un obiect"),
        Slide(image: "public/examples/scut/ritual.png", kicker: "04 · Împreună", title: "Lumi vă conduce, pas cu pas")
    ]
)

let patience = Film(
    output: "public/videos/trusa-de-rabdare.mp4",
    brand: "POVESTEA MEA MAGICĂ",
    title: "Așteptarea devine misiune.",
    subtitle: "Zece pagini alese pentru locul, timpul și vârsta copilului.",
    backgroundTop: NSColor(calibratedRed: 0.97, green: 0.93, blue: 0.84, alpha: 1),
    backgroundBottom: NSColor(calibratedRed: 0.91, green: 0.86, blue: 0.77, alpha: 1),
    accent: NSColor(calibratedRed: 0.50, green: 0.32, blue: 0.64, alpha: 1),
    text: NSColor(calibratedRed: 0.09, green: 0.14, blue: 0.23, alpha: 1),
    slides: [
        Slide(image: "public/examples/trusa-premium/page-1.png", kicker: "01 · Personalizezi", title: "Coperta spune: această misiune este a mea"),
        Slide(image: "public/examples/trusa-premium/page-2.png", kicker: "02 · Observi", title: "Radarul pornește chiar din locul în care sunteți"),
        Slide(image: "public/examples/trusa-premium/page-3.png", kicker: "03 · Rezolvi", title: "Labirintul se potrivește nivelului ales"),
        Slide(image: "public/examples/trusa-premium/page-4.png", kicker: "04 · Descoperi", title: "Cinci diferențe, construite și verificate"),
        Slide(image: "public/examples/trusa-premium/page-5.png", kicker: "05 · Păstrezi", title: "Cartonașe gata pentru următoarea așteptare")
    ]
)

let album = Film(
    output: "public/videos/povestea-magica.mp4",
    brand: "POVESTEA MEA MAGICĂ",
    title: "O poveste care îi seamănă.",
    subtitle: "Șaisprezece pagini ilustrate, audio în română și activități gata de print.",
    backgroundTop: NSColor(calibratedRed: 0.93, green: 0.90, blue: 0.98, alpha: 1),
    backgroundBottom: NSColor(calibratedRed: 0.98, green: 0.94, blue: 0.86, alpha: 1),
    accent: NSColor(calibratedRed: 0.42, green: 0.24, blue: 0.60, alpha: 1),
    text: NSColor(calibratedRed: 0.07, green: 0.12, blue: 0.22, alpha: 1),
    slides: [
        Slide(image: "public/examples/album/flipbook/page-01.webp", kicker: "01 · Îl recunoaște", title: "Numele copilului deschide povestea"),
        Slide(image: "public/examples/album/flipbook/page-04.webp", kicker: "02 · Descoperă", title: "Fiecare scenă continuă aceeași aventură"),
        Slide(image: "public/examples/album/flipbook/page-07.webp", kicker: "03 · Răsfoiește", title: "Ilustrațiile duc povestea mai departe"),
        Slide(image: "public/examples/album/flipbook/page-11.webp", kicker: "04 · Ascultă", title: "Audio în limba română, pentru seri împreună"),
        Slide(image: "public/examples/album/colorat.webp", kicker: "05 · Se joacă", title: "Activități separate, pregătite pentru print")
    ]
)

try render(night)
try render(patience)
try render(album)
