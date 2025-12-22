import os
import re

def update_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # Skip index.html as it is already updated
    if filepath.endswith('index.html'):
        return

    print(f"Processing {filepath}...")

    # 1. Update Navigation
    # Find the nav block
    # We look for the structure: <nav ...> ... </nav>
    # Note: re.DOTALL is needed to match across lines
    nav_pattern = re.compile(r'(<nav class="flex justify-between items-center mb-12">)(.*?)(</nav>)', re.DOTALL)

    match = nav_pattern.search(content)
    if match:
        nav_start = match.group(1)
        nav_content = match.group(2)
        nav_end = match.group(3)

        # Extract the desktop links div
        links_pattern = re.compile(r'(<div class="hidden md:flex gap-8 font-bold">)(.*?)(</div>)', re.DOTALL)
        links_match = links_pattern.search(nav_content)

        if links_match:
            links_div_content = links_match.group(2)

            # Extract individual links
            link_tag_pattern = re.compile(r'<a href="([^"]+)" class="([^"]+)">([^<]+)</a>')
            links = link_tag_pattern.findall(links_div_content)

            # Construct mobile menu links
            mobile_links_html = ""
            colors = ["bg-quixhr-yellow", "bg-quixhr-pink", "bg-quixhr-blue", "bg-quixhr-green"]
            for i, (href, classes, text) in enumerate(links):
                color_class = colors[i % len(colors)]
                # Basic hover class replacement for mobile feel
                mobile_links_html += f'            <a href="{href}" class="hover:{color_class} p-2">{text}</a>\n'

            # Construct the new nav content
            # We need to handle the LOGIN button or whatever is at the end.
            # In index.html it was a button. In others it might be the same.
            # Let's see what's after the links div.

            remaining_content = nav_content[links_match.end():].strip()

            # Create the new nav block
            new_nav_content = nav_start.replace('">', ' relative">') + '\n'

            # Get the logo part (everything before the links div)
            logo_part = nav_content[:links_match.start()].strip()
            new_nav_content += "        " + logo_part + "\n"
            new_nav_content += "        " + links_match.group(0) + "\n" # Keep desktop links

            # Mobile toggle and LOGIN button wrapper
            new_nav_content += '        <div class="flex items-center gap-4">\n'

            # Handle the LOGIN button (assuming it's a button at the end)
            # If it's the standard login button
            if '<button' in remaining_content and 'LOGIN' in remaining_content:
                # Add hidden md:block to it
                 login_btn = remaining_content.replace('<button class="', '<button class="hidden md:block ')
                 new_nav_content += "            " + login_btn + "\n"
            else:
                # If there is no login button or different structure, just append what was there?
                # But we want to hide it on mobile if it's the main CTA?
                # For safety, let's assume it is the login button as per inspection.
                # If we aren't sure, we can just dump remaining_content but wrapping it might be tricky.
                # Let's use regex to find the button and modify it.
                btn_match = re.search(r'<button.*?>.*?</button>', remaining_content, re.DOTALL)
                if btn_match:
                    btn_html = btn_match.group(0)
                    if 'class="' in btn_html:
                         btn_html = btn_html.replace('class="', 'class="hidden md:block ')
                    else:
                         btn_html = btn_html.replace('<button', '<button class="hidden md:block"')
                    new_nav_content += "            " + btn_html + "\n"

            # Add Hamburger
            new_nav_content += '''            <button id="mobile-menu-btn" class="md:hidden neo-brutal-border bg-white px-4 py-2 neo-brutal-shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
            </button>
        </div>
    </nav>'''

            # Add Mobile Menu Block
            mobile_menu_block = f'''
    <!-- Mobile Menu -->
    <div id="mobile-menu" class="hidden fixed inset-0 bg-white z-50 p-4 overflow-y-auto">
        <div class="flex justify-end mb-8">
            <button id="close-menu-btn" class="neo-brutal-border bg-white px-4 py-2 neo-brutal-shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
        </div>
        <div class="flex flex-col gap-8 font-black text-2xl text-center">
{mobile_links_html}            <button class="neo-brutal-border bg-quixhr-green px-6 py-2 font-black neo-brutal-shadow-sm mt-4">
                LOGIN
            </button>
        </div>
    </div>

    <script>
        const mobileMenuBtn = document.getElementById('mobile-menu-btn');
        const closeMenuBtn = document.getElementById('close-menu-btn');
        const mobileMenu = document.getElementById('mobile-menu');

        function toggleMenu() {{
            mobileMenu.classList.toggle('hidden');
            document.body.classList.toggle('overflow-hidden');
        }}

        mobileMenuBtn.addEventListener('click', toggleMenu);
        closeMenuBtn.addEventListener('click', toggleMenu);
    </script>'''

            # Replace the old nav with new nav + mobile menu
            content = content.replace(match.group(0), new_nav_content + mobile_menu_block)

    # 2. Fix Header Font Sizes
    # Look for h1 with text-6xl
    # We want to change 'text-6xl' to 'text-5xl md:text-6xl' or 'text-9xl' etc.
    # Pattern: class="... text-6xl ..."
    # We specifically want to target the main headers which might be too big.
    # In index.html it was text-6xl md:text-9xl.
    # In about.html it is text-4xl md:text-6xl.
    # Let's make text-6xl -> text-5xl md:text-6xl if md:text-6xl is not present?
    # Or just replace 'text-6xl' with 'text-5xl md:text-6xl' generally if it's an H1?

    # Let's go safe. If we see 'text-6xl', replace with 'text-5xl md:text-6xl' IF 'md:text-' is NOT already there for that specific size?
    # Actually, in index.html it was `text-6xl md:text-9xl`. I changed it to `text-5xl md:text-9xl`.
    # In about.html: `text-4xl md:text-6xl`. This is probably fine for mobile (text-4xl is ~36px).

    # So I only need to worry about `text-6xl` where it doesn't have a smaller mobile size.
    # Or where `text-6xl` IS the mobile size (because tailwind is mobile-first).
    # If a class has `text-6xl` and `md:text-9xl`, then on mobile it is 6xl.
    # So I should search for `text-6xl` and replace with `text-5xl` ONLY IF I also see `md:text-9xl` or similar larger size?
    # Or just replace `text-6xl` with `text-5xl` everywhere in class strings?
    # text-6xl is pretty big for mobile.

    # Let's replace `text-6xl` with `text-5xl` generally, but we must ensure we don't break `md:text-6xl`.
    # So we replace `text-6xl ` (with space) or `text-6xl"` (end of class).
    # But we should NOT replace `md:text-6xl`.

    # Regex lookbehind is good here but let's be simple.
    # We can iterate over matches of `class="..."` and modify inside.

    def replace_class(match):
        cls = match.group(1)
        # Split by space
        parts = cls.split()
        new_parts = []
        for part in parts:
            if part == 'text-6xl':
                new_parts.append('text-5xl')
            elif part == 'text-7xl': # Just in case
                new_parts.append('text-5xl')
            elif part == 'text-8xl':
                new_parts.append('text-6xl')
            # We preserve md:text-6xl because part != text-6xl
            else:
                new_parts.append(part)
        return f'class="{" ".join(new_parts)}"'

    content = re.sub(r'class="([^"]+)"', replace_class, content)

    # Write back
    with open(filepath, 'w') as f:
        f.write(content)

# Run for all html files in landing-page
directory = 'landing-page'
for filename in os.listdir(directory):
    if filename.endswith(".html"):
        update_file(os.path.join(directory, filename))
