window.__ModuleLoader__.load({
  id: '@local/dsh-chibi-slider',
  factory(require) {
    const React = require('react');
    const h = React.createElement;
    const {useState, useRef, useEffect, useLayoutEffect, useSyncExternalStore, useId} = React;
    const NS = 'local-chibi-slider';
    const SPRITES = '__SPRITE_SET__';
    const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
    const percentToIndex = (ratio, count) => count <= 1 ? 0 : Math.round(clamp(ratio, 0, 1) * (count - 1));
    const indexToPercent = (index, count) => count <= 1 ? 0 : clamp(index, 0, count - 1) / (count - 1);
    const isMaxEffort = (effort) => /^(max|maximum)$/i.test(effort?.id || '') || /^(max|maximum|最高|最大)$/i.test(effort?.name || '');
    const frameAt = (phase, elapsed, reduced = false) => {
      if (reduced) return 0;
      if (phase === 'moving') return elapsed < 110 ? 4 : elapsed < 220 ? 5 : 6 + Math.floor((elapsed - 220) / 85) % 6;
      if (phase === 'stopping') return elapsed < 320 ? 12 + Math.min(3, Math.floor(elapsed / 80)) : 0;
      const tick = elapsed % 4800;
      return tick > 3320 && tick < 3440 ? 2 : tick > 2000 && tick < 2500 ? 1 : tick > 3900 && tick < 4300 ? 3 : 0;
    };
    const zh = {
      title: '推理等级', choose: '选择模型', reset: '恢复当前模型的默认等级', close: '关闭', loading: '正在读取模型…',
      unavailable: '当前模型不可用，请选择其他模型', none: '该模型不提供可调推理等级', empty: '暂无可用模型',
      saving: '正在保存…', failed: '保存失败，已恢复原设置', retry: '重新加载', search: '搜索模型',
      hint: '拖动小鲸娘或点击档位', maxHint: 'Max · 星光全开', default: '默认', error: '模型目录读取失败',
      slider: '推理等级滑块', selectLabel: '模型与推理等级', provider: '提供方', noMatches: '未找到匹配的模型'
    };
    const en = {
      title: 'Reasoning effort', choose: 'Choose model', reset: 'Restore model default', close: 'Close', loading: 'Loading models…',
      unavailable: 'Model unavailable. Choose another model.', none: 'This model has no adjustable reasoning effort.', empty: 'No models available',
      saving: 'Saving…', failed: 'Save failed. Previous setting restored.', retry: 'Reload', search: 'Search models',
      hint: 'Drag the mascot or click a level', maxHint: 'Max · Starlight', default: 'Default', error: 'Could not load models',
      slider: 'Reasoning effort slider', selectLabel: 'Model and reasoning effort', provider: 'Provider', noMatches: 'No matching models'
    };
    const CSS = `
      .dcs-root {display:inline-flex;min-width:0;align-items:center;font:inherit;color:var(--dsw-alias-label-primary)}
      .dcs-root button,.dcs-panel button,.dcs-panel input{font:inherit;box-sizing:border-box}
      .dcs-trigger{display:inline-flex;align-items:center;gap:5px;max-width:290px;border:0;background:transparent;color:var(--dsw-alias-label-secondary);padding:5px 7px;border-radius:9px;cursor:pointer;font-size:14px!important;white-space:nowrap}
      .dcs-trigger:hover,.dcs-panel button:hover{background:var(--dsw-alias-interactive-bg-hover)}
      .dcs-trigger-name{overflow:hidden;text-overflow:ellipsis}
      .dcs-trigger-effort{color:var(--dsw-alias-label-tertiary)}
      .dcs-trigger[data-max=true] .dcs-trigger-effort{color:#9661f5}
      .dcs-trigger:disabled{opacity:.45;cursor:default}
      .dcs-panel{box-sizing:border-box;position:fixed;inset:auto;margin:0;padding:18px 18px 14px;width:356px;max-width:calc(100vw - 20px);max-height:calc(100vh - 24px);overflow:auto;border:1px solid var(--dsw-alias-border-l1);border-radius:23px;background:var(--dsw-alias-bg-module-platform);color:var(--dsw-alias-label-primary);box-shadow:0 12px 38px #15244b20;font:14px/1.4 system-ui,sans-serif;z-index:2147483000;isolation:isolate}
      .dcs-panel::backdrop{background:transparent;pointer-events:none}
      .dcs-header{display:grid;grid-template-columns:30px 1fr 30px;align-items:center}
      .dcs-icon{font-size:23px;line-height:1;color:#3479ff;user-select:none}
      .dcs-panel[data-max=true] .dcs-icon{color:#9661f5}
      .dcs-level{font-weight:650;font-size:23px;text-align:center;color:#3479ff;transition:color 240ms}
      .dcs-panel[data-max=true] .dcs-level{color:#9661f5}
      .dcs-reset,.dcs-close{padding:3px!important;width:28px;height:28px;border:0;border-radius:8px;background:transparent;color:var(--dsw-alias-label-tertiary);cursor:pointer;font-size:22px!important}
      .dcs-reset:disabled{opacity:.35;cursor:default}
      .dcs-model{display:flex;align-items:center;justify-content:center;gap:5px;max-width:100%;margin:5px auto 0;border:0;padding:2px 6px;border-radius:7px;background:transparent;color:var(--dsw-alias-label-secondary);cursor:pointer;font-size:13px!important}
      .dcs-model span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:265px}
      .dcs-runway{height:108px;position:relative;touch-action:none;user-select:none;cursor:pointer;outline:none}
      .dcs-lane{height:27px;position:absolute;left:22px;right:22px;bottom:0;border-radius:999px;background:#f2f2f4;box-shadow:inset 0 0 0 1px #d9d9df}
      .dcs-fill{position:absolute;inset:0 auto 0 0;border-radius:inherit;background:linear-gradient(90deg,#2674f6,#4d92ff);pointer-events:none}
      .dcs-purple{position:absolute;inset:0;border-radius:inherit;background:linear-gradient(90deg,#3e39dc,#9360fc 66%,#ac72ff);opacity:0;transition:opacity 280ms}
      .dcs-panel[data-max=true] .dcs-purple{opacity:1}
      .dcs-stars{position:absolute;inset:0;border-radius:inherit;overflow:hidden;opacity:0;transition:opacity 260ms}
      .dcs-panel[data-max=true] .dcs-stars{opacity:1}
      .dcs-star{position:absolute;color:white;font-size:8px;line-height:1;animation:dcs-twinkle 2.6s ease-in-out infinite;animation-play-state:paused;pointer-events:none}
      .dcs-panel[data-max=true] .dcs-star{animation-play-state:running}
      .dcs-dot{position:absolute;top:12px;width:4px;height:4px;background:#b7b7bd;border-radius:50%;transform:translate(-50%,-50%);pointer-events:none}
      .dcs-dot[data-filled=true]{background:#fff9}
      .dcs-dot[data-active=true]{background:white;box-shadow:0 0 7px #ffffff60}
      .dcs-mascot-position{position:absolute;top:13px;width:86px;height:86px;transform:translate(-50%,-88%);pointer-events:none;will-change:left}
      .dcs-mascot-position[data-drag=false]{transition:left 240ms cubic-bezier(.2,.7,.3,1)}
      .dcs-sprite{height:100%;margin:auto;background-repeat:no-repeat;background-size:400% 100%;transform-origin:50% 88%;filter:drop-shadow(0 2px 1px #25315916)}
      .dcs-sprite[data-phase=idle]{animation:dcs-breathe 2.8s ease-in-out infinite}
      .dcs-sprite-facing{width:100%;height:100%;transform:scaleX(var(--dcs-facing,1))}
      .dcs-level-labels{position:relative;height:23px;margin:8px 22px 0}
      .dcs-label{position:absolute;transform:translateX(-50%);border:0;background:transparent;color:var(--dsw-alias-label-tertiary);padding:3px 7px;border-radius:6px;cursor:pointer;font-size:12px!important;white-space:nowrap}
      .dcs-label[aria-pressed=true]{color:#3479ff;font-weight:600}
      .dcs-panel[data-max=true] .dcs-label[aria-pressed=true]{color:#9661f5}
      .dcs-label:disabled{cursor:default}
      .dcs-hint{min-height:17px;margin:11px 0 0;text-align:center;font-size:11px;color:var(--dsw-alias-label-caption)}
      .dcs-error{margin-top:10px;padding:8px;border-radius:8px;color:var(--dsw-alias-state-error-primary);font-size:12px;overflow-wrap:anywhere}
      .dcs-message{padding:17px 4px;text-align:center;font-size:13px;color:var(--dsw-alias-label-secondary)}
      .dcs-retry{display:block;margin:7px auto;border:1px solid var(--dsw-alias-border-l1);padding:5px 10px;border-radius:8px;background:transparent;color:var(--dsw-alias-label-primary);cursor:pointer}
      .dcs-models-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;font-weight:600}
      .dcs-search{width:100%;padding:8px 10px;border:1px solid var(--dsw-alias-border-l1);border-radius:9px;color:var(--dsw-alias-label-primary);background:transparent;outline:none;margin-bottom:10px}
      .dcs-model-list{max-height:290px;overflow:auto}
      .dcs-provider{font-size:11px;color:var(--dsw-alias-label-caption);padding:7px}
      .dcs-model-option{width:100%;display:flex;justify-content:space-between;align-items:center;gap:8px;border:0;border-radius:9px;padding:9px 8px;background:transparent;color:var(--dsw-alias-label-primary);text-align:left;cursor:pointer}
      .dcs-model-option[aria-selected=true]{background:var(--dsw-alias-interactive-bg-hover)}
      .dcs-panel :focus-visible,.dcs-root :focus-visible{outline:2px solid var(--dsw-alias-state-business-primary);outline-offset:3px}
      .dcs-runway[aria-disabled=true]{opacity:.5;cursor:default}
      @keyframes dcs-breathe{0%,100%{transform:translateY(0) scaleY(1)}50%{transform:translateY(-1px) scaleY(1.012)}}
      @keyframes dcs-twinkle{0%,100%{opacity:.35;transform:scale(.7)}50%{opacity:.95;transform:scale(1)}}
      @media(prefers-reduced-motion:reduce){.dcs-panel *{animation:none!important;transition:none!important}}
      @media(max-width:520px){.dcs-trigger{max-width:190px;font-size:12px!important}}
    `;

    function Sprite({moving, direction, reduced}) {
      const [motion, setMotion] = useState({phase: 'idle', since: performance.now()});
      const [frame, setFrame] = useState(0);
      const previous = useRef(false);
      useEffect(() => {
        if (moving !== previous.current) {
          previous.current = moving;
          setMotion({phase: moving ? 'moving' : 'stopping', since: performance.now()});
        }
      }, [moving]);
      useEffect(() => {
        const render = () => {
          const elapsed = performance.now() - motion.since;
          setFrame(frameAt(motion.phase, elapsed, reduced));
          if (motion.phase === 'stopping' && elapsed >= 320) setMotion({phase: 'idle', since: performance.now()});
        };
        render();
        if (reduced) return;
        const timer = setInterval(render, 40);
        return () => clearInterval(timer);
      }, [motion, reduced]);
      const facing = motion.phase === 'idle' || frame >= 14 ? 1 : direction;
      const asset = SPRITES[Math.floor(frame/4)];
      return h('div', {className:'dcs-sprite-facing', style:{'--dcs-facing':facing}},
        h('div', {className:'dcs-sprite', 'data-phase':motion.phase,
          style:{width:`${86*asset.width/(4*asset.height)}px`,backgroundImage:`url("${asset.url}")`,backgroundPosition:`${(frame%4)*100/3}% 0`}}));
    }

    function Slider({levels, value, disabled, onSelect, onPreview, t, reduced}) {
      const laneRef = useRef(null), rootRef = useRef(null), dragRef = useRef(null), moveTimer = useRef(null), paintRef = useRef(null), nextRatio = useRef(null);
      const [ratio, setRatio] = useState(null), [travel, setTravel] = useState(false), [direction, setDirection] = useState(1);
      const actualIndex = Math.max(0, levels.findIndex(x => x.id === value));
      const chosenIndex = ratio === null ? actualIndex : percentToIndex(ratio, levels.length);
      const shownRatio = ratio === null ? indexToPercent(actualIndex, levels.length) : ratio;
      const max = isMaxEffort(levels[chosenIndex]);
      const cancelPaint = () => { if(paintRef.current!==null)cancelAnimationFrame(paintRef.current);paintRef.current=null;nextRatio.current=null; };
      const scheduleRatio = (next) => {
        nextRatio.current=next;
        if(paintRef.current!==null)return;
        paintRef.current=requestAnimationFrame(()=>{
          paintRef.current=null;
          if(!dragRef.current)return;
          const position=nextRatio.current;
          setRatio(position);onPreview(levels[percentToIndex(position,levels.length)]);
        });
      };
      useEffect(() => () => { clearTimeout(moveTimer.current); cancelPaint(); onPreview(null); }, []);
      useEffect(() => {
        if (disabled && dragRef.current) { dragRef.current = null; cancelPaint(); setRatio(null); setTravel(false); onPreview(null); }
      }, [disabled]);
      const position = (x) => { const r = laneRef.current.getBoundingClientRect(); return clamp((x-r.left)/r.width,0,1); };
      const animateTo = (index) => {
        if (disabled || levels.length < 2 || index === actualIndex) return;
        setDirection(index >= actualIndex ? 1 : -1); setTravel(true);
        clearTimeout(moveTimer.current); moveTimer.current = setTimeout(() => setTravel(false), 320);
        onSelect(levels[index].id);
      };
      const finishDrag = (event, cancel = false) => {
        const drag = dragRef.current;
        if (!drag || drag.id !== event.pointerId) return;
        dragRef.current = null; cancelPaint();
        if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
        const next = percentToIndex(position(event.clientX), levels.length);
        setRatio(null); setTravel(false); onPreview(null);
        if (!cancel && !disabled && next !== actualIndex) onSelect(levels[next].id);
      };
      return h('div', {'data-slider-max':max},
        h('div', {className:'dcs-runway', ref:rootRef, role:'slider', tabIndex:disabled ? -1 : 0,
          'aria-label':t('slider'), 'aria-valuemin':0, 'aria-valuemax':Math.max(0,levels.length-1),
          'aria-valuenow':chosenIndex, 'aria-valuetext':levels[chosenIndex]?.name || '', 'aria-disabled':disabled,
          onPointerDown:e => {
            if(disabled || levels.length < 2 || (e.pointerType==='mouse' && e.button!==0))return;
            e.preventDefault(); e.currentTarget.focus(); e.currentTarget.setPointerCapture(e.pointerId);
            const next=position(e.clientX);
            dragRef.current={id:e.pointerId,x:e.clientX};setDirection(next>=indexToPercent(actualIndex,levels.length)?1:-1);
            clearTimeout(moveTimer.current);setRatio(next);setTravel(true);onPreview(levels[percentToIndex(next,levels.length)]);
          },
          onPointerMove:e => {
            const drag=dragRef.current;if(!drag || drag.id!==e.pointerId)return;
            if(Math.abs(e.clientX-drag.x)>1){setDirection(e.clientX>=drag.x?1:-1);drag.x=e.clientX;}
            scheduleRatio(position(e.clientX));
          },
          onPointerUp:e=>finishDrag(e), onPointerCancel:e=>finishDrag(e,true),
          onLostPointerCapture:()=>{if(dragRef.current){dragRef.current=null;cancelPaint();setRatio(null);setTravel(false);onPreview(null);}},
          onKeyDown:e=>{
            let next=actualIndex;
            if(e.key==='ArrowRight'||e.key==='ArrowUp')next++;
            else if(e.key==='ArrowLeft'||e.key==='ArrowDown')next--;
            else if(e.key==='Home')next=0;
            else if(e.key==='End')next=levels.length-1;
            else return;
            e.preventDefault();animateTo(clamp(next,0,levels.length-1));
          }},
          h('div',{className:'dcs-lane',ref:laneRef},
            h('div',{className:'dcs-fill',style:{width:`${shownRatio*100}%`}}),
            h('div',{className:'dcs-purple'}),
            h('div',{className:'dcs-stars','aria-hidden':true},Array.from({length:16},(_,i)=>h('span',{key:i,className:'dcs-star',style:{left:`${3+(i*37)%94}%`,top:`${14+(i*23)%60}%`,animationDelay:`${-(i*.29)}s`}},i%3===0?'✦':'·'))),
            levels.map((level,i)=>h('span',{key:level.id,className:'dcs-dot','data-active':i===chosenIndex,'data-filled':indexToPercent(i,levels.length)<=shownRatio,style:{left:`${indexToPercent(i,levels.length)*100}%`}})),
            h('div',{className:'dcs-mascot-position','data-drag':ratio!==null,style:{left:`${shownRatio*100}%`},'aria-hidden':true},h(Sprite,{moving:travel,direction,reduced})))),
        h('div',{className:'dcs-level-labels'},levels.map((level,i)=>h('button',{key:level.id,type:'button',className:'dcs-label',disabled,
          style:{left:`${indexToPercent(i,levels.length)*100}%`},'aria-pressed':i===chosenIndex,onClick:()=>animateTo(i)},level.name))));
    }

    function Panel({directory,load,select,available,locked,t}) {
      const state=useSyncExternalStore(fn=>directory.subscribe(fn),()=>directory.getSnapshot());
      const [open,setOpen]=useState(false),[pane,setPane]=useState('effort'),[query,setQuery]=useState('');
      const [error,setError]=useState(''),[saving,setSaving]=useState(false),[reduced,setReduced]=useState(false),[preview,setPreview]=useState(null);
      const rootRef=useRef(null), triggerRef=useRef(null),panelRef=useRef(null),searchRef=useRef(null),requestRef=useRef(false),mounted=useRef(true);
      const id=useId();
      const choices=state.groups.flatMap(group=>group.models.map(model=>({group,model})));
      const choice=choices.find(x=>x.group.id===state.current?.provider&&x.model.id===state.current?.model);
      const reasoning=choice?.model.reasoning;
      const intended=state.pending || state.current;
      const selectedEffort=intended?.reasoningEffort ?? reasoning?.defaultEffort;
      const levels=reasoning?.efforts || [];
      const level=levels.find(x=>x.id===selectedEffort);
      const isMax=isMaxEffort(level);
      const busy=saving||state.pending!==null;
      const label=choice?.model.name || state.retainedName || state.current?.model || t('choose');
      const levelLabel=level?.name || state.retainedEffort || selectedEffort || t('default');
      const close=()=>{setOpen(false);setPane('effort');setQuery('');triggerRef.current?.focus({preventScroll:true});};
      useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;};},[]);
      useEffect(()=>{
        if(available)load();
      },[available,directory]);
      useEffect(()=>{
        const media=window.matchMedia('(prefers-reduced-motion: reduce)');
        const update=()=>setReduced(media.matches);update();media.addEventListener('change',update);
        return()=>media.removeEventListener('change',update);
      },[]);
      useLayoutEffect(()=>{
        if(!open)return;
        const panel=panelRef.current;
        const place=()=>{
          const r=triggerRef.current.getBoundingClientRect();
          const width=Math.min(356,window.innerWidth-20), height=panel.offsetHeight;
          panel.style.width=`${width}px`;
          panel.style.left=`${clamp(r.right-width,10,Math.max(10,window.innerWidth-width-10))}px`;
          panel.style.top=`${r.top-height-10>=10?r.top-height-10:clamp(r.bottom+10,10,Math.max(10,window.innerHeight-height-10))}px`;
        };
        panel.showPopover();place();
        const resize=new ResizeObserver(place);resize.observe(panel);
        window.addEventListener('resize',place);window.addEventListener('scroll',place,true);
        const outside=e=>{if(!panel.contains(e.target)&&!triggerRef.current.contains(e.target))setOpen(false);};
        const key=e=>{if(e.key==='Escape'){e.preventDefault();close();}};
        document.addEventListener('pointerdown',outside);document.addEventListener('keydown',key);
        return()=>{resize.disconnect();window.removeEventListener('resize',place);window.removeEventListener('scroll',place,true);document.removeEventListener('pointerdown',outside);document.removeEventListener('keydown',key);if(panel.matches(':popover-open'))panel.hidePopover();};
      },[open]);
      useEffect(()=>{
        if(open&&pane==='models')searchRef.current?.focus();
        else if(open)panelRef.current?.querySelector('[role=slider]')?.focus({preventScroll:true});
      },[open,pane]);
      const submit=async(selection)=>{
        if(requestRef.current||busy||locked||!available)return;
        requestRef.current=true;setSaving(true);setError('');
        try{
          const result=await select(selection);
          if(!result?.ok)throw new Error(result?.error?.message || t('failed'));
        }catch(err){if(mounted.current)setError(`${t('failed')}：${err?.message || String(err)}`);}
        finally{requestRef.current=false;if(mounted.current)setSaving(false);}
      };
      const setEffort=effort=>{
        if(!state.current)return;
        const selection={provider:state.current.provider,model:state.current.model};
        if(effort!==undefined)selection.reasoningEffort=effort;
        return submit(selection);
      };
      const visible=state.groups.map(group=>({...group,models:group.models.filter(model=>model.name.toLowerCase().includes(query.trim().toLowerCase()))})).filter(group=>group.models.length);
      const disabled=busy||locked||!available||!choice;
      return h('div',{className:'dcs-root',ref:rootRef},
        h('style',null,CSS),
        h('button',{type:'button',className:'dcs-trigger',ref:triggerRef,disabled:locked||!available,
          'aria-expanded':open,'aria-controls':id,'aria-haspopup':'dialog','aria-label':`${t('selectLabel')}：${label} · ${levelLabel}`,'data-max':isMax,
          onClick:()=>{if(open)close();else{setPane(choice?'effort':'models');setQuery('');setError('');setOpen(true);load();}}},
          h('span',{className:'dcs-trigger-name'},label),h('span',{className:'dcs-trigger-effort'},levelLabel),h('span',{'aria-hidden':true},busy?'◌':open?'⌃':'⌄')),
        open&&h('div',{className:'dcs-panel',popover:'manual',ref:panelRef,id,role:'dialog','aria-label':t('title'),'aria-busy':busy,'data-max':preview?isMaxEffort(preview):isMax,
          onKeyDown:e=>{if(e.key==='Tab'){const focusable=Array.from(panelRef.current.querySelectorAll('button:not(:disabled),input,[role=slider][tabindex="0"]'));const at=focusable.indexOf(document.activeElement);if(e.shiftKey&&at===0){e.preventDefault();focusable.at(-1)?.focus();}else if(!e.shiftKey&&at===focusable.length-1){e.preventDefault();focusable[0]?.focus();}}}},
          pane==='models'?h(React.Fragment,null,
            h('div',{className:'dcs-models-header'},h('span',null,t('choose')),h('button',{type:'button',className:'dcs-close','aria-label':t('close'),onClick:()=>choice?setPane('effort'):close()},'×')),
            h('input',{className:'dcs-search',ref:searchRef,value:query,'aria-label':t('search'),placeholder:t('search'),onChange:e=>setQuery(e.target.value)}),
            h('div',{className:'dcs-model-list',role:'listbox','aria-label':t('choose')},visible.map(group=>h('div',{key:group.id},
              h('div',{className:'dcs-provider'},group.name||group.id),
              group.models.map(model=>h('button',{key:model.id,type:'button',role:'option',className:'dcs-model-option',disabled:busy,
                'aria-selected':state.current?.provider===group.id&&state.current?.model===model.id,
                onClick:async()=>{await submit({provider:group.id,model:model.id,...(model.reasoning?.defaultEffort===undefined?{}:{reasoningEffort:model.reasoning.defaultEffort})});if(mounted.current)setPane('effort');}},
                h('span',null,model.name),state.current?.provider===group.id&&state.current?.model===model.id?h('span',null,'✓'):null))))),
            visible.length===0&&h('div',{className:'dcs-message'},state.status==='loading'?t('loading'):query?t('noMatches'):t('empty')))
          :h(React.Fragment,null,
            h('div',{className:'dcs-header'},h('span',{className:'dcs-icon','aria-hidden':true},isMax?'✦':'ϟ'),
              h('div',{className:'dcs-level','aria-live':'polite'},preview?.name||levelLabel),
              h('button',{type:'button',className:'dcs-reset',title:t('reset'),'aria-label':t('reset'),disabled:disabled||!reasoning,onClick:()=>setEffort(reasoning?.defaultEffort)},'↶')),
            h('button',{type:'button',className:'dcs-model',onClick:()=>{setPane('models');setQuery('');}},h('span',null,label),'›'),
            levels.length?h(Slider,{key:`${state.current?.provider}/${state.current?.model}`,levels,value:selectedEffort,disabled,onSelect:setEffort,onPreview:setPreview,t,reduced}):h('div',{className:'dcs-message'},!choice?t('unavailable'):t('none')),
            h('div',{className:'dcs-hint','aria-live':'polite'},busy?t('saving'):isMax?t('maxHint'):t('hint'))),
          (error||state.error)&&h('div',{className:'dcs-error',role:'alert'},error||state.error),
          (state.status==='error'||state.failures?.length>0)&&h('button',{type:'button',className:'dcs-retry',onClick:()=>{setError('');load();}},t('retry'))));
    }

    return {
      inject:['slots','locale','modelDirectories','sessions','remote','remote.session'],
      apply(ctx){
        ctx.effect(()=>ctx.locale.register(NS,{zh,en}));
        ctx.slots.inject('conversation.input.model',()=>ctx.slots.register({
          name:'conversation.input.model',priority:-40,locale:NS,
          inject:(sessionId)=>{
            const directory=ctx.modelDirectories.directoryFor(sessionId);
            const available=ctx.sessions.subagentAddress(sessionId)===undefined;
            return {available,directory:directory.store,load:()=>{if(available)directory.load().catch(()=>{});},select:selection=>available?directory.select(selection):Promise.resolve(undefined)};
          }
        },Panel));
      },
      // Pure helpers exported for local verification; the host only uses apply/inject.
      __test:{percentToIndex,indexToPercent,isMaxEffort,frameAt}
    };
  }
});
