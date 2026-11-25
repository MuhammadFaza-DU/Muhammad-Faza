import type { SkillRecord } from "../../data/types";
import { projectOrbit } from "../../lib/orbit";

export default function ToolOrbit({ tools, selected, panelOpen, onSelect, onPause }: {
  tools: SkillRecord[]; selected?: string; panelOpen: boolean;
  onSelect: (skill: SkillRecord,trigger:HTMLButtonElement,pointer:boolean) => void;
  onPause: (reason: "hover" | "focus", value: boolean) => void;
}) {
  return <div className="tool-orbit" data-motion-scroll="orbit">
    {tools.map((tool, index) => {
      const position = projectOrbit(index * 2 * Math.PI / tools.length, { centerX: 50, centerY: 75, radiusX: 40, radiusY: 14 });
      return <button className="orbit-tool" key={tool.id} data-orbit-index={index} data-motion-owner="skill"
        data-depth={position.depth} style={{ left: `${position.x}%`, top: `${position.y}%` }}
        aria-label={tool.name} aria-expanded={selected === tool.id && panelOpen}
        aria-controls="skill-explanation" onClick={event => onSelect(tool,event.currentTarget,event.detail>0)}
        onPointerEnter={event => { if (event.pointerType === "mouse") onPause("hover", true); }}
        onPointerLeave={() => onPause("hover", false)}
        onFocus={() => onPause("focus", true)} onBlur={() => onPause("focus", false)}>
        <span className="orbit-tool__face">
          <img src={`/media/tools/${tool.id}.svg`} width={64} height={64} alt="" draggable={false} />
        </span>
      </button>;
    })}
  </div>;
}
