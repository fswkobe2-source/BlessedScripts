package net.runelite.client.plugins.scripts.ui;

import net.runelite.client.ui.PluginPanel;
import net.runelite.client.plugins.scripts.BlessedScriptsManagerPlugin;

import javax.inject.Inject;
import javax.swing.*;
import java.awt.*;
import java.awt.event.ActionEvent;
import java.io.File;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;

/**
 * BlessedScripts Manager Panel
 * Clean script management interface
 */
public class BlessedScriptsManagerPanel extends PluginPanel {
    
    @Inject
    public BlessedScriptsManagerPanel() {
        init();
    }

    private void init() {
        setLayout(new BorderLayout());
        setBorder(BorderFactory.createEmptyBorder(10, 10, 10, 10));
        
        // Header
        JPanel headerPanel = createHeaderPanel();
        add(headerPanel, BorderLayout.NORTH);
        
        // Main content
        JPanel contentPanel = createContentPanel();
        add(contentPanel, BorderLayout.CENTER);
        
        // Refresh scripts list
        refreshScriptsList();
    }
    
    private JPanel createHeaderPanel() {
        JPanel header = new JPanel(new BorderLayout());
        header.setBorder(BorderFactory.createEmptyBorder(0, 0, 10, 0));
        
        // Title
        JLabel titleLabel = new JLabel("BlessedScripts Manager");
        titleLabel.setFont(new Font("Arial", Font.BOLD, 16));
        titleLabel.setForeground(Color.WHITE);
        
        // Open folder button
        JButton openFolderBtn = new JButton("📁 Open Scripts Folder");
        openFolderBtn.setBackground(new Color(74, 144, 226));
        openFolderBtn.setForeground(Color.WHITE);
        openFolderBtn.setFocusPainted(false);
        openFolderBtn.addActionListener(this::openScriptsFolder);
        
        header.add(titleLabel, BorderLayout.WEST);
        header.add(openFolderBtn, BorderLayout.EAST);
        
        return header;
    }
    
    private JPanel createContentPanel() {
        JPanel content = new JPanel(new BorderLayout());
        
        // Search bar
        JPanel searchPanel = new JPanel(new BorderLayout());
        searchPanel.setBorder(BorderFactory.createEmptyBorder(0, 0, 10, 0));
        
        JTextField searchField = new JTextField();
        searchField.setText("🔍 Search scripts...");
        searchField.setForeground(Color.GRAY);
        searchField.setBorder(BorderFactory.createEmptyBorder(5, 5, 5, 5));
        searchField.addFocusListener(new java.awt.event.FocusAdapter() {
            public void focusGained(java.awt.event.FocusEvent evt) {
                if (searchField.getText().equals("🔍 Search scripts...")) {
                    searchField.setText("");
                    searchField.setForeground(Color.BLACK);
                }
            }
            public void focusLost(java.awt.event.FocusEvent evt) {
                if (searchField.getText().isEmpty()) {
                    searchField.setText("🔍 Search scripts...");
                    searchField.setForeground(Color.GRAY);
                }
            }
        });
        
        searchPanel.add(searchField, BorderLayout.CENTER);
        
        // Scripts list
        JPanel scriptsListPanel = new JPanel();
        scriptsListPanel.setLayout(new BoxLayout(scriptsListPanel, BoxLayout.Y_AXIS));
        
        JScrollPane scrollPane = new JScrollPane(scriptsListPanel);
        scrollPane.setPreferredSize(new Dimension(400, 300));
        scrollPane.setBorder(BorderFactory.createEmptyBorder(0, 0, 0, 0));
        scrollPane.getVerticalScrollBar().setUnitIncrement(16);
        scrollPane.setHorizontalScrollBarPolicy(JScrollPane.HORIZONTAL_SCROLLBAR_NEVER);
        
        content.add(searchPanel, BorderLayout.NORTH);
        content.add(scrollPane, BorderLayout.CENTER);
        
        return content;
    }
    
    private void refreshScriptsList() {
        JPanel scriptsListPanel = (JPanel) ((JScrollPane) ((JPanel) getComponent(1)).getComponent(1)).getViewport().getView();
        scriptsListPanel.removeAll();
        
        // Get scripts folder
        Path scriptsDir = BlessedScriptsManagerPlugin.getScriptsDir();
        File scriptsFolder = scriptsDir.toFile();
        
        if (!scriptsFolder.exists()) {
            JPanel noScriptsPanel = createNoScriptsPanel("Scripts folder not found", "Creating scripts folder...");
            scriptsListPanel.add(noScriptsPanel);
        } else {
            // Scan for .jar files
            File[] scriptFiles = scriptsFolder.listFiles((dir, name) -> 
                name.toLowerCase().endsWith(".jar")
            );
            
            if (scriptFiles == null || scriptFiles.length == 0) {
                JPanel noScriptsPanel = createNoScriptsPanel(
                    "No scripts found", 
                    "Drop .jar files into your scripts folder or visit BlessedScripts.com to download scripts"
                );
                scriptsListPanel.add(noScriptsPanel);
            } else {
                // Add script cards
                for (File scriptFile : scriptFiles) {
                    JPanel scriptCard = createScriptCard(scriptFile);
                    scriptsListPanel.add(scriptCard);
                    scriptsListPanel.add(Box.createVerticalStrut(5));
                }
            }
        }
        
        scriptsListPanel.revalidate();
        scriptsListPanel.repaint();
    }
    
    private JPanel createNoScriptsPanel(String title, String message) {
        JPanel panel = new JPanel(new BorderLayout());
        panel.setBorder(BorderFactory.createCompoundBorder(
            BorderFactory.createLineBorder(Color.GRAY, 1),
            BorderFactory.createEmptyBorder(20, 20, 20, 20)
        ));
        panel.setBackground(new Color(240, 240, 240));
        
        JLabel titleLabel = new JLabel(title);
        titleLabel.setFont(new Font("Arial", Font.BOLD, 14));
        titleLabel.setHorizontalAlignment(SwingConstants.CENTER);
        
        JLabel messageLabel = new JLabel("<html><center>" + message + "</center></html>");
        messageLabel.setHorizontalAlignment(SwingConstants.CENTER);
        
        panel.add(titleLabel, BorderLayout.NORTH);
        panel.add(messageLabel, BorderLayout.CENTER);
        
        return panel;
    }
    
    private JPanel createScriptCard(File scriptFile) {
        JPanel card = new JPanel(new BorderLayout());
        card.setBorder(BorderFactory.createCompoundBorder(
            BorderFactory.createLineBorder(new Color(200, 200, 200), 1),
            BorderFactory.createEmptyBorder(10, 10, 10, 10)
        ));
        card.setBackground(Color.WHITE);
        card.setMaximumSize(new Dimension(380, 80));
        
        // Script info
        JPanel infoPanel = new JPanel(new BorderLayout());
        
        JLabel nameLabel = new JLabel(scriptFile.getName().replace(".jar", ""));
        nameLabel.setFont(new Font("Arial", Font.BOLD, 12));
        nameLabel.setForeground(new Color(74, 144, 226));
        
        JLabel descLabel = new JLabel("User Script • " + formatFileSize(scriptFile.length()));
        descLabel.setFont(new Font("Arial", Font.PLAIN, 10));
        descLabel.setForeground(Color.GRAY);
        
        infoPanel.add(nameLabel, BorderLayout.NORTH);
        infoPanel.add(descLabel, BorderLayout.CENTER);
        
        // Action buttons
        JPanel buttonPanel = new JPanel(new FlowLayout(FlowLayout.RIGHT, 5, 0));
        
        JButton runButton = new JButton("▶ Run");
        runButton.setBackground(new Color(52, 211, 153));
        runButton.setForeground(Color.WHITE);
        runButton.setFocusPainted(false);
        runButton.setFont(new Font("Arial", Font.BOLD, 10));
        runButton.addActionListener(e -> runScript(scriptFile));
        
        JButton deleteButton = new JButton("🗑");
        deleteButton.setBackground(Color.WHITE);
        deleteButton.setBorder(BorderFactory.createLineBorder(Color.RED, 1));
        deleteButton.setForeground(Color.RED);
        deleteButton.setFocusPainted(false);
        deleteButton.setFont(new Font("Arial", Font.BOLD, 10));
        deleteButton.addActionListener(e -> deleteScript(scriptFile));
        
        buttonPanel.add(runButton);
        buttonPanel.add(deleteButton);
        
        card.add(infoPanel, BorderLayout.CENTER);
        card.add(buttonPanel, BorderLayout.EAST);
        
        return card;
    }
    
    private void openScriptsFolder(ActionEvent e) {
        try {
            Path scriptsDir = BlessedScriptsManagerPlugin.getScriptsDir();
            Desktop.getDesktop().open(scriptsDir.toFile());
        } catch (Exception ex) {
            JOptionPane.showMessageDialog(this, 
                "Failed to open scripts folder: " + ex.getMessage(), 
                "Error", 
                JOptionPane.ERROR_MESSAGE);
        }
    }
    
    private void runScript(File scriptFile) {
        JOptionPane.showMessageDialog(this, 
            "Script runner will be implemented in next version!\n\nSelected: " + scriptFile.getName(), 
            "BlessedScripts", 
            JOptionPane.INFORMATION_MESSAGE);
    }
    
    private void deleteScript(File scriptFile) {
        int result = JOptionPane.showConfirmDialog(this,
            "Delete script '" + scriptFile.getName() + "'?",
            "Delete Script",
            JOptionPane.YES_NO_OPTION);
        if (result == JOptionPane.YES_OPTION) {
            if (scriptFile.delete()) {
                refreshScriptsList();
                JOptionPane.showMessageDialog(this,
                    "Script deleted successfully!",
                    "Success",
                    JOptionPane.INFORMATION_MESSAGE);
            } else {
                JOptionPane.showMessageDialog(this,
                    "Failed to delete script!",
                    "Error",
                    JOptionPane.ERROR_MESSAGE);
            }
        }
    }
    
    private String formatFileSize(long bytes) {
        if (bytes < 1024) {
            return bytes + " B";
        } else if (bytes < 1024 * 1024) {
            return String.format("%.1f KB", bytes / 1024.0);
        } else {
            return String.format("%.1f MB", bytes / (1024.0 * 1024.0));
        }
    }
}
