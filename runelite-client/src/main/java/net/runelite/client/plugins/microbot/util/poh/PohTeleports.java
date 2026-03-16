package net.runelite.client.plugins.microbot.util.poh;

import net.runelite.api.coords.WorldPoint;
import java.util.List;
import java.util.Map;

/**
 * Stub implementation of PohTeleports
 */
public class PohTeleports {
    
    public static boolean isInHouse() {
        return false; // Stub implementation
    }
    
    public static WorldPoint getHouseLocation() {
        return null; // Stub implementation
    }
    
    public static boolean teleportToLocation(String location) {
        return false; // Stub implementation
    }
    
    public static List<String> getAvailableTeleports() {
        return List.of(); // Empty list
    }
    
    public static Map<String, WorldPoint> getTeleportLocations() {
        return Map.of(); // Empty map
    }
}
