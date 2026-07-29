# Guide: 3D Exercise Animation Prompts & Assembly

This guide contains the exact prompts and commands used to generate consistent 3D exercise keyframes and compile them into smooth looping animations.

---

## 🎨 1. Prompt Design System & Rules

To maintain visual consistency across all exercises in the application, follow these guidelines:

1. **Character Definition**: `10-year-old boy with short brown hair, wearing a grey t-shirt and blue athletic shorts, barefoot`.
2. **Environment**: `grey yoga mat, soft studio lighting, clean isolated pure white background`.
3. **Style Keyword**: `smooth matte 3D Pixar-inspired aesthetic`.
4. **Orientation**: Always specify `Side profile view facing LEFT: head on the left side of the frame, feet on the right side of the frame`.

---

## 📝 2. Exact Keyframe Prompts (Cat-Camel Example)

### Keyframe 1: Neutral Starting Position
> `A cute 3D digital character render of a 10-year-old boy with short brown hair wearing a grey t-shirt and blue shorts, performing the neutral starting pose of the cat-camel exercise on a grey yoga mat. Side profile view facing LEFT: head on the left, feet on the right. Hands and knees on the mat, straight relaxed spine, looking slightly down. Soft studio lighting, smooth matte 3D Pixar-inspired aesthetic, clean isolated pure white background, consistent studio setting.`

### Keyframe 2: Cat Arch Pose (Expirar / Back Arched Upward)
> `A cute 3D digital character render of the exact same 10-year-old boy with short brown hair wearing a grey t-shirt and blue shorts, performing the Cat arch pose of the cat-camel exercise on a grey yoga mat. Side profile view facing LEFT: head on the left, feet on the right. Hands and knees on the mat, back rounded and arched high upward like a cat, head tucked looking down gently. Soft studio lighting, smooth matte 3D Pixar-inspired aesthetic, clean isolated pure white background, consistent studio setting.`

### Keyframe 3: Camel Dip Pose (Inspirar / Back Dipped Downward)
> `A cute 3D digital character render of the exact same 10-year-old boy with short brown hair wearing a grey t-shirt and blue shorts, performing the Camel dip pose of the cat-cow exercise on a grey yoga mat. Side profile view facing LEFT: head on the left, feet on the right. On hands and knees, with his spine arched distinctly downward towards the floor (belly dipping low towards the mat, concave lower back curve), and his head tilted gently upward looking forward to the left. Clear anatomical exercise demonstration of the lower back dip. Soft studio lighting, smooth matte 3D Pixar-inspired aesthetic, clean isolated pure white background.`

---

## 🎬 3. FFmpeg Assembly Recipe

Execute the following commands to morph keyframes into a smooth crossfade MP4 video and an optimized GIF loop:

```bash
# Step A: Blend 3 keyframes into a 30 FPS MP4 video loop
ffmpeg -y \
  -loop 1 -t 2.0 -i keyframe_neutral.jpg \
  -loop 1 -t 2.0 -i keyframe_arched.jpg \
  -loop 1 -t 2.0 -i keyframe_dipped.jpg \
  -filter_complex "[0:v]scale=1024:1024:force_original_aspect_ratio=increase,crop=1024:1024[v0]; \
                   [1:v]scale=1024:1024:force_original_aspect_ratio=increase,crop=1024:1024[v1]; \
                   [2:v]scale=1024:1024:force_original_aspect_ratio=increase,crop=1024:1024[v2]; \
                   [v0][v1]xfade=transition=fade:duration=0.6:offset=1.4[f0]; \
                   [f0][v2]xfade=transition=fade:duration=0.6:offset=2.8[f1]; \
                   [f1][v0]xfade=transition=fade:duration=0.6:offset=4.2[outv]" \
  -map "[outv]" -c:v libx264 -pix_fmt yuv420p -r 30 exercise_loop.mp4

# Step B: Convert MP4 to high quality looping GIF
ffmpeg -y -i exercise_loop.mp4 -vf "fps=15,scale=512:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse" exercise_loop.gif
```
