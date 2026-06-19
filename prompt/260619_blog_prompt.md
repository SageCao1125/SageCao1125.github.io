I have an existing personal academic website at:

```text
F:\My Website\sage
```

The current website contains the main sections `Home`, `About`, `Research`, and `Misc`, arranged vertically on the homepage. I recently created a new technical blog section, and the blog content has already been prepared locally at:

```text
G:\Desktop\HKU\Projects\2026 Math Blog
```

Please integrate this existing blog content into my personal website in an elegant, polished, and academic way.

## 1. Navigation Structure

Update the main navigation order to:

```text
Home / About / Blog / Research / Misc
```

The `Blog` item should be a first-class navigation item, not a subsection of `Misc`.

Please preserve the existing visual identity of the website, including typography, spacing, colors, and the overall academic/minimal style. Do not redesign the entire website unnecessarily.

## 2. Import and Reuse Existing Blog Content

The blog content is already created in:

```text
G:\Desktop\HKU\Projects\2026 Math Blog
```

Please inspect that folder and reuse the existing blog files/content rather than creating placeholder content.

If the blog folder contains Markdown, MDX, HTML, CSS, assets, images, figures, or bibliography/reference files, please integrate them properly into the website structure.

The current main blog article is about:

```text
The Mathematical Essence of Three World Model Paradigms in Robot Learning
```

The article focuses on the mathematical principles behind three representative world-model paradigms for robot learning:

```text
1. IDM-style
2. Single-backbone-style
3. MoT-style
```

Please make sure this topic is reflected accurately in the blog title, summary, metadata, homepage highlight, and blog index page.

Do not describe the article generically as only “world models for robot learning.” The emphasis should be on the mathematical structure and principles behind the three paradigms: IDM-style, Single-backbone-style, and MoT-style.

## 3. Homepage Blog Highlight Section

On the homepage, add a compact blog highlight section before the existing `Research` section.

The section can be titled either:

```text
Featured Blog
```

or preferably:

```text
Featured Writing
```

This homepage section should:

* Match the current homepage style.
* Be visually subtle, elegant, and consistent with the existing website.
* Highlight the main blog article.
* Appear before the `Research` section.
* Include a short title, date if available, tags if appropriate, and a concise description.
* Include a clean call-to-action link:

```text
View all writing →
```

This link should navigate to the standalone Blog page.

For the highlighted article, use a title similar to:

```text
The Math Behind World Model Paradigms for Robot Learning
```

Suggested homepage summary:

```text
A mathematical analysis of three common World Model paradigms in robot learning from the perspectives of probabilistic modeling and structured optimization: IDM-style, Single-backbone, and MoT-style.
```

Suggested tags:

```text
Robot Learning, World Models, Mathematical Notes
```

The homepage highlight should look like a natural part of the original academic website, not like a separate external blog widget.

## 4. Standalone Blog Page

Create a dedicated Blog page, preferably at:

```text
/blog/
```

The Blog page should be more visually refined and atmospheric than the homepage highlight section, while still remaining consistent with the academic personal website.

Use the following blog as design inspiration:

```text
https://yang-song.net/blog/
```

Do not copy it directly. Instead, use it as inspiration for a clean, elegant, research-oriented technical writing index.

The Blog page should include:

* A page title, preferably:

```text
Blog
```

or:

```text
Writing
```

* A refined subtitle such as:

```text
Technical notes, research essays, and mathematical reflections on robot learning, world models, and embodied intelligence.
```

* A list of blog posts displayed as elegant article rows or minimal cards.
* Each blog item should include:

  * Title
  * Date, if available
  * Short summary
  * Tags
  * Reading-time estimate, if easy to implement

The current main post should be listed as:

```text
The Math Behind World Model Paradigms for Robot Learning
```

Its summary should explicitly mention:

```text
IDM-style, Single-backbone-style, and MoT-style world-model paradigms.
```

The Blog page should be responsive and look good on both desktop and mobile.

## 5. Individual Blog Post Page

Connect the individual blog post page for the existing article from:

```text
G:\Desktop\HKU\Projects\2026 Math Blog
```

Preferred route:

```text
/blog/math-of-world-model-paradigms/
```

The post page should be suitable for a long technical article with mathematical notation.

Please support:

* Markdown or MDX-style content if compatible with the existing stack.
* LaTeX/math rendering via KaTeX or MathJax if needed.
* Code blocks.
* Figures and images.
* Figure captions.
* Bibliography/references if present.
* A clean reading layout.
* A left-side or sticky table of contents for long posts if feasible.
* Good typography for equations, headings, captions, and references.

The article page should feel like a polished technical research blog, not a generic GitHub Pages article.

## 7. Style Direction

The visual direction should be:

* Elegant
* Minimal
* Academic
* High-end
* Calm and refined
* Suitable for mathematical technical writing
* Similar in spirit to a polished research blog
* Consistent with the original personal website

Avoid:

* Loud colors
* Heavy animations
* Overly playful blog-card designs
* Large distracting gradients
* Excessive visual clutter
* A design that feels disconnected from the existing website

Subtle hover effects, soft borders, refined typography, and generous spacing are welcome.

## 8. Technical Requirements

Please inspect the existing website codebase and adapt the implementation to the actual framework used by the website.

Do not assume a specific stack before checking the repository structure.

Depending on the existing setup:

* If it is a static HTML/CSS website, implement the Blog page using the same HTML/CSS structure.
* If it uses Jekyll, add a proper blog collection or posts structure.
* If it uses React/Next/Vite, create reusable `BlogCard`, `BlogIndex`, and `BlogPost` components where appropriate.
* If the blog folder already has its own HTML/CSS/Markdown structure, integrate it cleanly rather than rewriting everything from scratch.
* If there is an existing layout system, reuse it.
* If there is an existing global CSS/theme file, extend it cleanly rather than duplicating styles.
* Keep the implementation simple, maintainable, and compatible with GitHub Pages deployment.

If the local path:

```text
G:\Desktop\HKU\Projects\2026 Math Blog
```

is not accessible from the current Codex workspace, please clearly tell me which files or folders I need to copy into the website repository, and where they should be placed.

## 9. Acceptance Criteria

After the modification:

1. The main navigation shows:

```text
Home / About / Blog / Research / Misc
```

2. The homepage contains a compact featured blog/writing section before `Research`.

3. The homepage highlight includes the article:

```text
The Math Behind World Model Paradigms for Robot Learning
```

4. The article summary explicitly mentions:

```text
IDM-style, Single-backbone-style, and MoT-style
```

5. The `View all writing →` link opens the dedicated Blog page.

6. The Blog page lists the article with title, summary, tags, and date if available.

7. Clicking the article opens the individual post page.

8. The individual post page correctly renders the existing blog content from:

```text
G:\Desktop\HKU\Projects\2026 Math Blog
```

9. Mathematical notation, figures, code blocks, and references render properly if present.

10. Existing `Home`, `About`, `Research`, and `Misc` content should remain intact.

11. The website should build and deploy normally on GitHub Pages.

Please implement the changes directly in the codebase, keeping the homepage consistent with the current website style while making the standalone Blog section feel more refined, elegant, and suitable for serious mathematical technical writing.
