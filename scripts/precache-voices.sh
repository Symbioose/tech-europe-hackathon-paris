#!/usr/bin/env bash
set -euo pipefail
mkdir -p public/demo
say -v Samantha -o public/demo/voice-f-young-sample.aiff "I clicked because that hook named exactly what I felt last Tuesday. I bought it on the way to the kitchen."
say -v Karen -o public/demo/voice-f-mid-sample.aiff "Honestly, this is the first ad in months that doesn't sound like every other wellness pitch."
say -v Alex -o public/demo/voice-m-young-sample.aiff "It worked because it spoke to a specific moment. I rejected the others because they all promised optimization."
say -v Daniel -o public/demo/voice-m-mid-sample.aiff "The line about rest hit me. I've been pushing too hard. Now I want to know what my data actually says."
say -v Bruce -o public/demo/voice-m-mature-sample.aiff "I'm tired of gadgets. But the way this was framed felt like advice, not a sales pitch."

for f in public/demo/voice-*.aiff; do
  out="${f%.aiff}.m4a"
  if command -v ffmpeg >/dev/null 2>&1; then
    ffmpeg -y -i "$f" -c:a aac -b:a 96k "$out" 2>/dev/null
    rm "$f"
  else
    # No ffmpeg — rename aiff to m4a (aiff data; works in macOS Safari only).
    mv "$f" "${f%.aiff}.m4a"
  fi
done
echo "Voice samples cached in public/demo/voice-*.m4a"
