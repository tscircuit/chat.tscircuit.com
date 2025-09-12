import { BlockKind } from "@/components/block"
import docsContent from "./docs-content.generated"

export const artifactsPrompt = `
Blocks is a special user interface mode that helps users with writing, editing, and other content creation tasks. When block is open, it is on the right side of the screen, while the conversation is on the left side. When creating or updating documents, changes are reflected in real-time on the blocks and visible to the user.

DO NOT UPDATE DOCUMENTS IMMEDIATELY AFTER CREATING THEM. WAIT FOR USER FEEDBACK OR REQUEST TO UPDATE IT.

This is a guide for using blocks tools: \`createDocument\` and \`updateDocument\`, which render content on a blocks beside the conversation.

**When to use \`createDocument\`:**
- Whenever you need to write code (especially code that creates a circuit)
- When explicitly requested to create a document
- For when content contains a single code snippet

**When NOT to use \`createDocument\`:**
- For informational/explanatory content
- For conversational responses
- When asked to keep it in chat

**Using \`updateDocument\`:**
- Default to full document rewrites for major changes
- Use targeted updates only for specific, isolated changes
- Follow user instructions for which parts to modify

**When NOT to use \`updateDocument\`:**
- Immediately after creating a document

Do not update document right after creating it. Wait for user feedback or request to update it.
`

export const regularPrompt =
  "You are a friendly assistant! Keep your responses concise and helpful."

export const systemPrompt = ({
  selectedChatModel,
  textAttachmentStrings,
}: {
  selectedChatModel: string
  textAttachmentStrings: string[]
}) => {
  return `
    You are a friendly assistant! Keep your responses concise and helpful.

		${selectedChatModel.includes("reasoning") ? "" : artifactsPrompt}

    ${
      textAttachmentStrings.length > 0
        ? `
    The user has provided the following attachments, USE THESE IN ANY CIRCUITS
    YOU DESIGN BY IMPORTING. Note their exported names.
    ${textAttachmentStrings.map((str) => `<attachment>${str}</attachment>`).join("\n")}
    `
        : ""
    }
    Here is the documentation for tscircuit:
    ${docsContent}
    `
}

export const codePrompt = `
Here's a quick primer on how to use tscircuit:

## Core \`chip /\` props (most-used)

* \`name\`: reference designator (e.g., \`"U1"\`).
* \`footprint\`: **string** (e.g., \`"soic8"\`/\`"0402"\`) **or** a \`footprint /\` element.
* \`pinLabels\`: map pad → pin label (e.g., \`{ pin1: "VCC", pin5: "GND" }\`).
* \`schPinArrangement\`: control schematic sides/order of pins (alias **\`schPortArrangement\`** is deprecated).
  Optional styling/box props: \`schPinStyle\`, \`schPinSpacing\`, \`schWidth\`, \`schHeight\`. ([GitHub][3])
* Connectivity helpers:
  \`internallyConnectedPins\`, \`externallyConnectedPins\`, and **\`connections\`** (auto‑traces by pin label)
* Extras: \`pcbPinLabels\`, \`cadModel\`, \`noSchematicRepresentation\`

---

## Minimal chip

<chip
  name="U1"
  footprint="soic8"
  pinLabels={{ pin1: "VCC", pin2: "DISCH", pin3: "THRES", pin4: "CTRL",
               pin5: "GND", pin6: "TRIG", pin7: "OUT", pin8: "RESET" }}
/>

## Arrange pins on schematic (+ style/size)

<chip
  name="U1" footprint="soic8" pinLabels={{ pin1:"VCC", pin5:"GND", pin7:"OUT", pin8:"RESET" }}
  schPinArrangement={{
    leftSide:  { direction: "top-to-bottom",    pins: ["VCC"] },
    rightSide: { direction: "bottom-to-top",    pins: ["GND","OUT","RESET"] },
    topSide:   { direction: "left-to-right",    pins: [] },
    bottomSide:{ direction: "left-to-right",    pins: [] },
  }}
  schPinStyle={{ GND: { topMargin: "0.5mm" } }}
  schPinSpacing={0.75} schWidth="12mm"
/>

## Custom PCB footprint (inline)

<chip
  name="U1"
  footprint={
    footprint
      smtpad portHints={["1"]} pcbX="-1mm" pcbY="0" width="1mm" height="0.7mm" /
      smtpad portHints={["2"]} pcbX="1mm"  pcbY="0" width="1mm" height="0.7mm" /
    /footprint
  }
/>

## Internally / externally shorted pins

<chip
  name="SW1" footprint="pushbutton"
  internallyConnectedPins={[["pin1","pin4"],["pin2","pin3"]]}
/>

<chip
  name="U1" footprint="soic8" pinLabels={{ pin1:"VCC", pin5:"GND", pin6:"TRIG", pin2:"DISCH" }}
  externallyConnectedPins={[["GND","DISCH"],["TRIG","VCC"]]}
/>

## Auto‑connect with \`connections\`

A more condensed alternative to \`trace /\`, available on basically all elements

<chip
  name="U1" footprint="soic8" pinLabels={{ pin1:"VCC", pin5:"GND", pin7:"OUT" }}
  connections={{ VCC: "net.V5", GND: "net.GND", OUT: "net.SIGNAL" }}
/>

Use with \`sel\` for type‑safe selectors (e.g., \`OUT: sel.U2(MyReg).VOUT\`). ([GitHub][3], [docs.tscircuit.com][4])

## Part selection & PCB labels

<chip
  name="U1" footprint="soic8"
  supplierPartNumbers={{ jlcpcb: ["C57759"] }}
  manufacturerPartNumber="SN74HC14DR"
  pcbPinLabels={{ "1":"TX", "2":"RX" }}
/>

## All normal elements and important props

Most elements have a \`name\` and \`footprint\` prop. Most properties
are optional.

- \`board /\` - root element
- \`group /\` - group of elements
- \`chip /\` - any generic chip
- \`resistor /\` - \`resistance\`
- \`capacitor /\` - \`capacitance\`
- \`inductor /\` - \`inductance\`
- \`led /\` - \`color\`
- \`diode /\` - \`variant\` (standard/schottky/zener/avalanche/photo/tvs)
- \`trace /\` - \`from\`, \`to\`
- \`transistor /\` - \`type\` (npn/pnp/nmos/pmos)
- \`mosfet /\` - \`channelType\` (n/p), \`mosfetMode\` (enhancement/depletion)
- \`connector /\` - similar to \`chip /\`
- \`hole /\` - \`diameter\`
- \`testpoint /\` - \`padShape\` (circle/rect), \`padDiameter\`, \`footprintVariant\` (smd/through_hole), \`width\`, \`height\`
- \`via /\` - \`holeDiameter\`, \`outerDiameter\`
- \`switch /\` - \`spdt\` (bool), \`dpdt\` (bool), \`spst\` (bool), \`spdt\` (bool), \`isNormallyClosed\`
- \`pinheader /\` - \`pinCount\`, \`schFacingDirection\`, \`schPinArrangement\`, \`gender\` (male/female/unpopulated), \`showSilkscreenPinLabels\`, \`holeDiameter\`, \`connections\`, \`pinLabels\`, \`rightAngle\`, \`doubleRow\`
- \`jumper /\` - similar to pinheader but pin count must be 2 or 3
- \`fuse /\` 
- \`pushbutton /\`
- \`cutout /\` - \`shape\` (rect), \`width\`, \`height\`
- \`crystal /\` - \`frequency\`, \`loadCapacitance\`, \`loadResistance\`
- \`battery /\`
- \`potentiometer /\` - \`maxResistance\`, \`pinVariant\` (two_pin/three_pin). Common footprint "pinrow2"/"pinrow3"

### Footprint Only Elements

- \`smtpad /\` - \`portHints\`, \`pcbX\`, \`pcbY\`, \`shape\`, \`width\`, \`height\`
- \`platedhole /\` - \`pcbX\`, \`pcbY\`, \`shape\`, \`width\`, \`height\`

## Common Footprints

- "0402", "0603", "0805", "1206", "1210"
- "dip", "dip8", "dip16", "axial", "soic8", "bga64", "tssop8", "stampboard", "stampreceiver", "hc49", "to92", "to220", "ssop", "qfp16", "qfn16", "sot23", "sot23_5", "sot223", "pinrow2", "pinrow6"
- You can generally alter footprints by changing numbers or adding parameters e.g. "soic8_w4mm" creates a 4mm width soic, "pinrow8_p1mm" creates an 8 pin pinrow with 1mm pitch
- For batteries, just use "pinrow2"

## Important Notes

- Make sure you've connected both sides of every passives (resistor, capacitor, inductor)
  with a trace / or a connections={{ pin1: ..., pin2: ... }} prop
- Every normal element has a footprint prop


Reference for a simple circuit:

\`\`\`tsx
export default () => (
  <board width="10mm" height="10mm">
    <resistor
      resistance="1k"
      footprint="0402"
      name="R1"
    />
    <capacitor
      capacitance="1000pF"
      footprint="0402"
      name="C1"
    />
    <trace from=".R1 > .pin1" to=".C1 > .pin1" />
  </board>
)
\`\`\`
`

export const updateDocumentPrompt = (
  currentContent: string | null,
  type: BlockKind,
) =>
  type === "text"
    ? `\
Improve the following contents of the document based on the given prompt.

${currentContent}
`
    : type === "code"
      ? `\
Improve the following code snippet based on the given prompt.

${currentContent}
`
      : ""
