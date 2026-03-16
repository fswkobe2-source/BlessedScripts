package net.runelite.client.plugins.microbot.util.gameobject;

import net.runelite.api.*;
import net.runelite.api.coords.WorldPoint;
import java.util.List;
import java.util.ArrayList;

/**
 * Stub implementation of Rs2GameObject
 */
public class Rs2GameObject {
    
    public static List<GameObject> getGameObjects() {
        return new ArrayList<>(); // Empty list
    }
    
    public static List<GameObject> getGameObjects(int id) {
        return new ArrayList<>(); // Empty list
    }
    
    public static List<GameObject> getGameObjects(String name) {
        return new ArrayList<>(); // Empty list
    }
    
    public static GameObject getNearestGameObject(int id) {
        return null; // Stub implementation
    }
    
    public static GameObject getNearestGameObject(String name) {
        return null; // Stub implementation
    }
    
    public static boolean interact(GameObject gameObject, String action) {
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
    
    public static WorldPoint getLocation(GameObject gameObject) {
        return gameObject != null ? gameObject.getWorldLocation() : null;
    }
    
    public static int getId(GameObject gameObject) {
        return gameObject != null ? gameObject.getId() : -1;
    }
}
