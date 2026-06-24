import os
import re
import json

def parse_script():
    script_path = os.path.join(os.path.dirname(__file__), 'GAL劇本_椎名日和線.md')
    output_path = os.path.join(os.path.dirname(__file__), 'game_script.json')

    if not os.path.exists(script_path):
        print(f"Script file not found: {script_path}")
        return

    with open(script_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    game = {
        "acts": []
    }

    current_act = None
    current_speaker = None
    current_expression = None
    current_choice = None
    current_branch = None

    # Regex definitions
    act_regex = re.compile(r'^##\s+第\s*(\d+)\s*幕：\s*(.*)$')
    loc_regex = re.compile(r'^\*\*地點：\s*(.*)\*\*$')
    time_regex = re.compile(r'^\*\*時間：\s*(.*)\*\*$')
    bgm_regex = re.compile(r'^\*\*BGM：\s*(.*)\*\*$')
    se_regex = re.compile(r'^\*\*(特殊效果|特殊特效)：\s*(.*)\*\*$')
    scene_desc_regex = re.compile(r'^\*\*【場景：\s*(.*)】\*\*$')
    speaker_regex = re.compile(r'^\*\*(.*?)\*\*(?:（(.*?)）)?：$')
    dialogue_regex = re.compile(r'^>\s*(.*)$')
    choice_option_regex = re.compile(r'^>\s*\*\*([A-C])）\s*(.*)\*\*$')
    choice_header_regex = re.compile(r'^\*\*【選擇肢\s*(\d+-\d+)】\*\*$')
    branch_header_regex = re.compile(r'^\*\*【選擇([A-C])(?:.*?)\】\*\*$')
    cg_regex = re.compile(r'^\*\*【獲得：\s*(CG-\d+)「(.*?)」\s*—\s*(.*?)】\*\*$')
    act_end_regex = re.compile(r'^\*\*【幕結束】\*\*$')
    convergence_regex = re.compile(r'^\*\*【匯流：\s*(.*)】\*\*$')
    action_regex = re.compile(r'^\*(.*?)\*$')

    def add_node(node):
        nonlocal current_act, current_choice, current_branch
        if not current_act:
            return
        if current_choice and current_branch:
            # Find the option in the current choice
            option = next((opt for opt in current_choice['options'] if opt['key'] == current_branch), None)
            if option:
                option['nodes'].append(node)
            else:
                print(f"Warning: Branch option {current_branch} not found in choice {current_choice['id']}")
        else:
            current_act['nodes'].append(node)

    for line in lines:
        line = line.strip()
        if not line:
            continue

        # 1. Act Header
        match = act_regex.match(line)
        if match:
            if current_choice:
                current_act['nodes'].append(current_choice)
                current_choice = None
                current_branch = None

            current_act = {
                "id": int(match.group(1)),
                "title": match.group(2).strip(),
                "metadata": {
                    "location": '',
                    "time": '',
                    "bgm": '',
                    "se": ''
                },
                "nodes": []
            }
            game['acts'].append(current_act)
            current_speaker = None
            current_expression = None
            continue

        if not current_act:
            continue

        # 2. Metadata
        match = loc_regex.match(line)
        if match:
            current_act['metadata']['location'] = match.group(1).strip()
            continue
        
        match = time_regex.match(line)
        if match:
            current_act['metadata']['time'] = match.group(1).strip()
            continue
            
        match = bgm_regex.match(line)
        if match:
            current_act['metadata']['bgm'] = match.group(1).strip()
            continue
            
        match = se_regex.match(line)
        if match:
            current_act['metadata']['se'] = match.group(2).strip()
            continue

        # 3. Act End
        if act_end_regex.match(line):
            if current_choice:
                current_act['nodes'].append(current_choice)
                current_choice = None
                current_branch = None
            add_node({"type": 'act_end'})
            continue

        # 4. CG Unlock
        match = cg_regex.match(line)
        if match:
            add_node({
                "type": 'cg_unlock',
                "cgId": match.group(1).strip(),
                "title": match.group(2).strip(),
                "description": match.group(3).strip()
            })
            continue

        # 5. Choice block start
        match = choice_header_regex.match(line)
        if match:
            if current_choice:
                current_act['nodes'].append(current_choice)
            current_choice = {
                "type": 'choice',
                "id": match.group(1),
                "options": []
            }
            current_branch = None
            continue

        # 6. Choice options
        match = choice_option_regex.match(line)
        if match:
            if current_choice:
                current_choice['options'].append({
                    "key": match.group(1),
                    "text": match.group(2).strip(),
                    "nodes": []
                })
            else:
                print(f"Warning: Choice option found outside of a choice block: {line}")
            continue

        # 7. Choice Branch Start
        match = branch_header_regex.match(line)
        if match:
            current_branch = match.group(1)
            continue

        # 8. Convergence Point
        match = convergence_regex.match(line)
        if match:
            if current_choice:
                current_act['nodes'].append(current_choice)
                current_choice = None
                current_branch = None
            add_node({
                "type": 'convergence',
                "text": match.group(1).strip()
            })
            continue

        # 9. Scene Description
        match = scene_desc_regex.match(line)
        if match:
            if current_choice and current_branch:
                current_act['nodes'].append(current_choice)
                current_choice = None
                current_branch = None
            add_node({
                "type": 'scene_desc',
                "text": match.group(1).strip()
            })
            continue

        # 10. Speaker Header
        match = speaker_regex.match(line)
        if match:
            current_speaker = match.group(1).strip()
            current_expression = match.group(2).strip() if match.group(2) else None
            continue

        # 11. Dialogue Quote
        match = dialogue_regex.match(line)
        if match:
            if current_speaker:
                text_val = match.group(1).strip()
                is_monologue = text_val.startswith('（') and text_val.endswith('）')
                cleaned_text = text_val
                if is_monologue:
                    cleaned_text = text_val[1:-1]
                elif text_val.startswith('「') and text_val.endswith('」'):
                    cleaned_text = text_val[1:-1]

                add_node({
                    "type": 'dialogue',
                    "speaker": current_speaker,
                    "expression": current_expression,
                    "text": cleaned_text,
                    "isMonologue": is_monologue
                })
            else:
                text_val = match.group(1).strip()
                add_node({
                    "type": 'narrative',
                    "text": text_val
                })
            continue

        # 12. Action lines
        match = action_regex.match(line)
        if match:
            action_text = match.group(1).strip()
            if action_text.startswith('——'):
                action_text = action_text[2:].strip()
            add_node({
                "type": 'action',
                "text": action_text
            })
            continue

        if line == '---':
            continue

    if current_choice:
        current_act['nodes'].append(current_choice)

    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(game, f, ensure_ascii=False, indent=2)
    
    print(f"Successfully parsed script! Saved to: {output_path}")
    print(f"Total acts parsed: {len(game['acts'])}")

if __name__ == "__main__":
    parse_script()
