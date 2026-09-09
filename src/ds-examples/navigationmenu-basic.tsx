"use client"

/*
 * NavigationMenu — two triggers in a row, each with a panel of links. Hover
 * or focus a trigger to open; sliding to the other trigger keeps the popup
 * open. The real parts, unused anywhere else in the prototype.
 *
 * The tree — a Portal → Positioner → Popup → Viewport per item — is the one
 * the design-system page has always rendered; base-ui documents one portal
 * per root. See the open questions in docs/components/navigationmenu.md
 * before copying this into a product surface.
 */

import {
  NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink,
  NavigationMenuList, NavigationMenuPopup, NavigationMenuPortal,
  NavigationMenuPositioner, NavigationMenuTrigger, NavigationMenuViewport,
} from "@/components/ui/navigation-menu"

const DISCOVER = ["New releases", "Charts", "Genres", "Editorial", "Live sessions", "Independent"]
const STUDIO   = ["Music", "Wallet", "Reports", "Manage"]

export default function NavigationMenuBasicExample() {
  return (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger>Discover</NavigationMenuTrigger>
          <NavigationMenuPortal>
            <NavigationMenuPositioner>
              <NavigationMenuPopup>
                <NavigationMenuViewport>
                  <NavigationMenuContent>
                    <div className="grid grid-cols-2 gap-1 min-w-[320px]">
                      {DISCOVER.map(label => (
                        <NavigationMenuLink key={label} href="#">{label}</NavigationMenuLink>
                      ))}
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuViewport>
              </NavigationMenuPopup>
            </NavigationMenuPositioner>
          </NavigationMenuPortal>
        </NavigationMenuItem>

        <NavigationMenuItem>
          <NavigationMenuTrigger>Studio</NavigationMenuTrigger>
          <NavigationMenuPortal>
            <NavigationMenuPositioner>
              <NavigationMenuPopup>
                <NavigationMenuViewport>
                  <NavigationMenuContent>
                    <div className="flex flex-col gap-1 min-w-[240px]">
                      {STUDIO.map(label => (
                        <NavigationMenuLink key={label} href="#">{label}</NavigationMenuLink>
                      ))}
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuViewport>
              </NavigationMenuPopup>
            </NavigationMenuPositioner>
          </NavigationMenuPortal>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  )
}
