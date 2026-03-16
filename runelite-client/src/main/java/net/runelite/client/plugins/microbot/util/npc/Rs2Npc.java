package net.runelite.client.plugins.microbot.util.npc;

import net.runelite.api.NPC;
import net.runelite.api.coords.WorldPoint;
import java.util.List;
import java.util.ArrayList;

/**
 * Stub implementation of Rs2Npc
 */
public class Rs2Npc {
    
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
    
    public static boolean interact(NPC npc, String action) {
        return false; // Stub implementation
    }
    
    public static boolean interact(int id, String action) {
        return false; // Stub implementation
    }
    
    public static boolean interact(String name, String action) {
        return false; // Stub implementation
    }
    
    public static boolean exists(int id) {
        return false; // Stub implementation
    }
    
    public static boolean exists(String name) {
        return false; // Stub implementation
    }
    
    public static WorldPoint getLocation(NPC npc) {
        return npc != null ? npc.getWorldLocation() : null;
    }
    
    public static int getId(NPC npc) {
        return npc != null ? npc.getId() : -1;
    }
    
    public static String getName(NPC npc) {
        return npc != null ? npc.getName() : "Unknown";
    }
    
    public static boolean isDead(NPC npc) {
        return npc != null && npc.getHealthRatio() == 0;
    }
    
    public static boolean isInCombat(NPC npc) {
        return npc != null && npc.isInCombat();
    }
}
