## ADDED Requirements

### Requirement: Live HTML preview
The system SHALL render the active report's HTML in a sandboxed iframe within the preview panel.

#### Scenario: Report renders in preview
- **WHEN** a report is opened or rendered
- **THEN** the report's index.html is displayed in the preview iframe

#### Scenario: Auto-reload on file change
- **WHEN** the report's output files change on disk
- **THEN** the preview iframe reloads automatically within 500ms

#### Scenario: Preview panel resize
- **WHEN** user drags the resizer between chat and preview panels
- **THEN** both panels resize proportionally and the preview reflows

### Requirement: Diagram source editing
The system SHALL allow users to view and edit diagram source directly from the preview.

#### Scenario: Click diagram to open editor
- **WHEN** user clicks on a rendered diagram (SVG/PNG) in the preview
- **THEN** an inline editor panel opens below the preview showing the diagram source (PlantUML/Mermaid/Python)

#### Scenario: Live diagram preview in editor
- **WHEN** user edits diagram source in the inline editor
- **THEN** a live-rendered preview of the diagram updates next to the source editor within 2 seconds

#### Scenario: Save diagram changes
- **WHEN** user clicks "Save" in the diagram editor
- **THEN** the source file is written to disk, the diagram is re-rendered, and the preview refreshes

#### Scenario: Edit diagram with AI
- **WHEN** user right-clicks a diagram and selects "Edit with AI"
- **THEN** the diagram source code is sent to the chat session as a message for AI-assisted editing

### Requirement: Interactive HTML editing
The system SHALL support direct manipulation of text in the report preview.

#### Scenario: Hover highlights element
- **WHEN** user hovers over a text element in the preview
- **THEN** the element is outlined and a tooltip shows its HTML tag and CSS classes

#### Scenario: Click to edit text
- **WHEN** user clicks a text element in the preview
- **THEN** the element becomes contentEditable and user can modify the text directly

#### Scenario: Shift+Click for multi-select
- **WHEN** user holds Shift and clicks multiple elements
- **THEN** all clicked elements are added to a selection set with visual highlight

#### Scenario: Send selection to AI
- **WHEN** elements are selected and user clicks "Send to AI" in the toolbar
- **THEN** the HTML source of selected elements is sent to the chat session as context

### Requirement: Artifact navigation
The system SHALL allow users to navigate between artifacts in a report.

#### Scenario: View artifacts list
- **WHEN** a report with multiple artifacts is open
- **THEN** the preview panel shows a dropdown or tab bar listing all artifacts

#### Scenario: Switch artifact view
- **WHEN** user selects a different artifact from the list
- **THEN** the preview switches to that artifact (diagram, chart, section)
