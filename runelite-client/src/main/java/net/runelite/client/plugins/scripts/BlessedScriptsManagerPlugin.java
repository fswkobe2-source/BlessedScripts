package net.runelite.client.plugins.scripts;

import com.google.inject.Inject;
import net.runelite.client.plugins.Plugin;
import net.runelite.client.plugins.PluginDescriptor;
import net.runelite.client.ui.ClientToolbar;
import net.runelite.client.ui.NavigationButton;
import net.runelite.client.util.ImageUtil;
import net.runelite.client.plugins.scripts.ui.BlessedScriptsManagerPanel;

import javax.swing.*;
import java.awt.image.BufferedImage;
import java.io.File;
import java.nio.file.Path;
import java.nio.file.Paths;

/**
 * BlessedScripts Script Manager Plugin
 * Replaces the Microbot Plugin Hub with a clean script manager
 */
@PluginDescriptor(
    name = "BlessedScripts Manager",
    description = "Manage BlessedScripts user scripts",
    hidden = false
)
public class BlessedScriptsManagerPlugin extends Plugin {
    private static final Path SCRIPTS_DIR = Paths.get(System.getProperty("user.home"), ".blessedscripts", "scripts");
    
    @Inject
    private ClientToolbar clientToolbar;
    
    private NavigationButton navButton;
    private BlessedScriptsManagerPanel managerPanel;

    @Override
    protected void startUp() throws Exception {
        // Create scripts folder if it doesn't exist
        createScriptsFolder();
        
        // Create the manager panel
        managerPanel = new BlessedScriptsManagerPanel();
        
        // Create navigation button
        final BufferedImage icon = ScriptIcon.createScriptIcon();
        
        navButton = NavigationButton.builder()
            .tooltip("Scripts")
            .icon(icon)
            .priority(1)
            .panel(managerPanel)
            .build();
            
        clientToolbar.addNavigation(navButton);
    }

    @Override
    protected void shutDown() throws Exception {
        clientToolbar.removeNavigation(navButton);
    }
    
    private void createScriptsFolder() {
        File scriptsFolder = SCRIPTS_DIR.toFile();
        if (!scriptsFolder.exists()) {
            boolean created = scriptsFolder.mkdirs();
            if (created) {
                System.out.println("Created BlessedScripts scripts folder: " + SCRIPTS_DIR);
            } else {
                System.err.println("Failed to create scripts folder: " + SCRIPTS_DIR);
            }
        }
    }
    
    public static Path getScriptsDir() {
        return SCRIPTS_DIR;
    }
}
