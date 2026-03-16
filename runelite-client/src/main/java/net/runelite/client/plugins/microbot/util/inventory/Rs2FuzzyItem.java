package net.runelite.client.plugins.microbot.util.inventory;

import java.util.List;
import java.util.ArrayList;

/**
 * Stub implementation of Rs2FuzzyItem
 */
public class Rs2FuzzyItem {
    
    public static List<Integer> findSimilarItems(int itemId) {
        return new ArrayList<>(); // Empty list
    }
    
    public static List<Integer> findSimilarItems(String itemName) {
        return new ArrayList<>(); // Empty list
    }
    
    public static boolean isSimilarItem(int itemId1, int itemId2) {
        return false; // Stub implementation
    }
    
    public static int getItemId(String itemName) {
        return -1; // Stub implementation
    }
    
    public static String getItemName(int itemId) {
        return "Unknown"; // Stub implementation
    }
}
