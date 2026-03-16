package net.runelite.client.plugins.microbot.util.npc;

import net.runelite.api.NPC;
import net.runelite.api.coords.WorldPoint;
import java.util.List;
import java.util.ArrayList;
import java.util.Map;
import java.util.HashMap;

/**
 * Stub implementation of Rs2NpcManager
 */
public class Rs2NpcManager {
    
    public static List<NPC> getNpcs() {
        return new ArrayList<>(); // Empty list
    }
    
    public static List<NPC> getNpcs(int id) {
        return new ArrayList<>(); // Empty list
    }
    
    public static List<NPC> getNpcs(String name) {
        return new ArrayList<>(); // Empty list
    }
    
    public static NPC getNearestNpc(int id) {
        return null; // Stub implementation
    }
    
    public static NPC getNearestNpc(String name) {
        return null; // Stub implementation
    }
    
    public static List<String> getSlayerMonstersByCategory(String category) {
        return new ArrayList<>(); // Empty list
    }
    
    public static Map<String, List<WorldPoint>> getMonsterLocations() {
        return new HashMap<>(); // Empty map
    }
    
    public static WorldPoint getClosestLocation(String monsterName, int minClustering, boolean avoidWilderness) {
        return null; // Stub implementation
    }
}
