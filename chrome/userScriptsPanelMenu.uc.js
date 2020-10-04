"use strict";
// ==UserScript==
// @name            userChromeJS Manager in Panel Menu
// @include         main
// @author          Alex Vallat
// @startup         UC.userScriptsPanelMenu.startup(win);
// @shutdown        UC.userScriptsPanelMenu.shutdown(win);
// @onlyonce
// ==/UserScript==

UC.userScriptsPanelMenu = {

    startup: function (window) {
        const doc = window.document;
        const viewCache = doc.getElementById("appMenu-viewCache").content;
        
        if (viewCache)
        {
            const userChromeJsPanel = doc.createXULElement("panelview");
            userChromeJsPanel.id = "appMenu-userChromeJsView";
            userChromeJsPanel.className = "PanelUI-subView";
            userChromeJsPanel.addEventListener("ViewShowing", UC.userScriptsPanelMenu.onPopup);
            {
                const subviewBody = doc.createXULElement("vbox");
                subviewBody.className = "panel-subview-body";
                subviewBody.appendChild(this.createMenuItem("openChrome", "url(chrome://browser/skin/folder.svg)", "Open chrome directory", "Services.dirsvc.get('UChrm', Ci.nsIFile).launch()"));
                subviewBody.appendChild(this.createMenuItem("restart", "url(chrome://browser/skin/reload.svg)", "Restart Firefox", "Services.appinfo.invalidateCachesOnRestart();BrowserUtils.restartApplication();"));
                subviewBody.appendChild(doc.createXULElement("toolbarseparator"));
                const enabledMenuItem = this.createMenuItem("enabled", null, "Enabled", "xPref.set(_uc.PREF_ENABLED, !!this.checked)");
                enabledMenuItem.type = "checkbox";
                subviewBody.appendChild(enabledMenuItem);
                const scriptsSeparator = doc.createXULElement("toolbarseparator");
                scriptsSeparator.id = "appMenu-userChromeJS-scriptsSeparator";
                subviewBody.appendChild(scriptsSeparator);
                userChromeJsPanel.appendChild(subviewBody);
            }
            viewCache.appendChild(userChromeJsPanel);

            const scriptsButton = doc.createXULElement("toolbarbutton");
            scriptsButton.id = "appMenu-userChromeJS-button";
            scriptsButton.className = "subviewbutton subviewbutton-iconic subviewbutton-nav";
            scriptsButton.label = "User Scripts";
            scriptsButton.style.listStyleImage = "url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAABeSURBVDhPY6AKSCms+x+SkPMfREOFwACXOAYYNQBVITrGJQ7CUO0IA0jFUO0QA3BhkEJs4iAM1Y4bgBTBDIAKkQYGlwHYMFQZbgBSBDIAF4Yqww3QbUTHUGWUAAYGAEyi7ERKirMnAAAAAElFTkSuQmCC)";
            scriptsButton.setAttribute("closemenu", "none");
            scriptsButton.setAttribute("oncommand", "PanelUI.showSubView('appMenu-userChromeJsView', this)");

            const addonsButton = doc.getElementById("appMenu-addons-button") ?? viewCache.getElementById("appMenu-addons-button");
            addonsButton.parentElement.insertBefore(scriptsButton, addonsButton);
        }
    },

    onPopup: function (aEvent) {
        const enabledMenuItem = aEvent.target.querySelector("#appMenu-userChromeJS-enabled");
        enabledMenuItem.checked = xPref.get(_uc.PREF_ENABLED);

        // Clear existing scripts menu entries
        const scriptsSeparator = aEvent.target.querySelector("#appMenu-userChromeJS-scriptsSeparator");
        while (scriptsSeparator.nextSibling) {
            scriptsSeparator.nextSibling.remove();
        }

        // Populate with new entries
        Object.values(_uc.scripts).forEach(script => {
            if (_uc.ALWAYSEXECUTE.includes(script.filename)) {
                return;
            }

            let scriptMenuItem = UC.userScriptsPanelMenu.createMenuItem(null, null, script.name ? script.name : script.filename, "UC.rebuild.toggleScript(_uc.scripts[this.filename]);");
            scriptMenuItem.setAttribute("onclick", "UC.rebuild.clickScriptMenu(event);");
            scriptMenuItem.type = "checkxbox";
            scriptMenuItem.checked = script.isEnabled;
            scriptMenuItem.setAttribute("restartless", !!script.shutdown);
            scriptMenuItem.filename = script.filename;
            let homepage = script.homepageURL || script.downloadURL || script.updateURL || script.reviewURL;
            if (homepage) {
                scriptMenuItem.setAttribute('homeURL', homepage);
            }
            scriptMenuItem.setAttribute('tooltiptext', `
          Left-Click: Enable/Disable
          Middle-Click: Enable/Disable and keep this menu open
          Right-Click: Edit
          Ctrl + Left-Click: Reload Script
          Ctrl + Middle-Click: Open Homepage
          Ctrl + Right-Click: Uninstall
        `.replace(/^\n| {2,}/g, '') + (script.description ? '\nDescription: ' + script.description : '')
                + (homepage ? '\nHomepage: ' + homepage : ''));

            scriptsSeparator.parentElement.appendChild(scriptMenuItem);
        });
	},

    shutdown: function (window) {
        const scriptsButton = window.document.getElementById("appMenu-userChromeJS-button");
        if ( scriptsButton ) {
            try{
                scriptsButton.parentElement.removeChild(scriptsButton);
            } catch (e) {
                console.log("Unable to remove appMenu-userChromeJS-button: ", e);
            }
        }

        const scriptsPanel = window.document.getElementById("appMenu-userChromeJsView");
        if (scriptsPanel) {
            try {
                scriptsPanel.parentElement.removeChild(scriptsPanel);
            } catch (e) {
                console.log("Unable to remove appMenu-userChromeJsView: ", e);
            }
        }
    },

    createMenuItem: function (id, icon, label, command) {
        const menuItem = window.document.createXULElement("toolbarbutton");
        menuItem.className = "subviewbutton subviewbutton-iconic";
        if (id) {
            menuItem.id = "appMenu-userChromeJS-" + id;
        }
        menuItem.label = label;
        menuItem.style.listStyleImage = icon;
        menuItem.setAttribute("oncommand", command);
        return menuItem;
    }
}