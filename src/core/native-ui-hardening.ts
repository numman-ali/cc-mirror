export type NativeUiHardeningResult = {
  content: string;
  changed: boolean;
  applied: string[];
  missing: string[];
};

const replaceFirst = (
  source: string,
  pattern: RegExp,
  replacement: string,
  label: string,
  applied: string[],
  missing: string[]
): string => {
  if (!pattern.test(source)) {
    missing.push(label);
    return source;
  }
  applied.push(label);
  return source.replace(pattern, replacement);
};

export const applyCcMirrorNativeUiHardening = (source: string): NativeUiHardeningResult => {
  const applied: string[] = [];
  const missing: string[] = [];
  let content = source;

  content = replaceFirst(
    content,
    /(\{id:"opus48-launch",tier:"announcement",type:"info",promo:!1,priority:[^,{}]+,isActive:\(\)=>)[$\w]+\(\)(,render:\(\)=>[$\w.]+\.createElement\([$\w]+,null\)\})/,
    '$1!1$2',
    'opus48-launch-announcement',
    applied,
    missing
  );

  content = replaceFirst(
    content,
    /([$\w]+)=([$\w]+)\?([$\w]+)\.createElement\(\2\.Title,null\):\3\.createElement\(([$\w]+),\{bold:!0\},"Claude Code"\)/,
    '$1=$3.createElement($4,{bold:!0},process.env.CC_MIRROR_PROVIDER_LABEL||"cc-mirror")',
    'startup-title-brand',
    applied,
    missing
  );

  content = replaceFirst(
    content,
    /([$\w]+)=([$\w]+)\.createElement\(([$\w]+),null,([$\w]+)," ",\2\.createElement\(\3,\{dimColor:!0\},"v",[$\w]+\)\)/,
    '$1=$2.createElement($3,null,$4)',
    'startup-title-version',
    applied,
    missing
  );

  return {
    content,
    changed: content !== source,
    applied,
    missing,
  };
};
