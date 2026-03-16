package net.runelite.client.plugins.microbot.api;

/**
 * Interface for entities in the game world
 */
public interface IEntity {
    
    /**
     * Get the unique identifier for this entity
     */
    long getId();
    
    /**
     * Get the name of this entity
     */
    String getName();
    
    /**
     * Check if this entity is valid/active
     */
    boolean isValid();
    
    /**
     * Get the world location of this entity
     */
    net.runelite.api.coords.WorldPoint getWorldLocation();
}
