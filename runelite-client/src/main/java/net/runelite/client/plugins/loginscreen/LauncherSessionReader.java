/*
 * Copyright (c) 2024, Blessed Scripts
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice, this
 *    list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the documentation
 *    and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
 * ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
package net.runelite.client.plugins.loginscreen;

import com.google.gson.Gson;
import com.google.inject.Inject;
import lombok.extern.slf4j.Slf4j;
import net.runelite.api.Client;
import net.runelite.api.GameState;
import net.runelite.api.events.GameStateChanged;
import net.runelite.client.eventbus.Subscribe;
import net.runelite.client.plugins.Plugin;
import net.runelite.client.plugins.PluginDescriptor;
import net.runelite.client.account.SessionManager;
import net.runelite.client.account.AccountSession;

import javax.inject.Singleton;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Instant;
import java.util.UUID;

/**
 * Reads session data from Blessed Scripts Launcher and automatically logs in
 */
@PluginDescriptor(
	name = "Launcher Session Reader",
	description = "Reads launcher session data for automatic login",
	hidden = true
)
@Slf4j
@Singleton
public class LauncherSessionReader extends Plugin
{
	private static final String BLESSED_SCRIPTS_DIR = ".blessedscripts";
	private static final String SESSION_FILE = "current-session.json";
	
	@Inject
	private Client client;
	
	@Inject
	private SessionManager sessionManager;
	
	private final Gson gson = new Gson();
	
	@Override
	protected void startUp()
	{
		log.info("Launcher Session Reader started");
	}
	
	@Override
	protected void shutDown()
	{
		log.info("Launcher Session Reader stopped");
	}
	
	@Subscribe
	public void onGameStateChanged(GameStateChanged event)
	{
		if (event.getGameState() == GameState.LOGIN_SCREEN)
		{
			// Try to read launcher session and auto-login
			tryAutoLogin();
		}
	}
	
	/**
	 * Attempts to read session data from launcher and perform auto-login
	 */
	private void tryAutoLogin()
	{
		try
		{
			Path sessionPath = getSessionFilePath();
			if (!Files.exists(sessionPath))
			{
				log.debug("No launcher session file found");
				return;
			}
			
			String sessionJson = Files.readString(sessionPath);
			LauncherSession session = gson.fromJson(sessionJson, LauncherSession.class);
			
			if (session == null || session.getSessionId() == null)
			{
				log.warn("Invalid session data in launcher file");
				return;
			}
			
			// Check if session is recent (within last hour)
			if (session.getSelectedOn() != null)
			{
				Instant selectedTime = Instant.parse(session.getSelectedOn());
				Instant now = Instant.now();
				
				if (selectedTime.plusSeconds(3600).isBefore(now))
				{
					log.debug("Launcher session is too old, ignoring");
					return;
				}
			}
			
			log.info("Found launcher session for user: {}", session.getUsername());
			
			// Create AccountSession from launcher data
			AccountSession accountSession = new AccountSession(
				UUID.fromString(session.getSessionId()),
				Instant.now(),
				session.getUsername()
			);
			
			// Use reflection to open the session
			try
			{
				java.lang.reflect.Method openSessionMethod = SessionManager.class.getDeclaredMethod("openSession", AccountSession.class);
				openSessionMethod.setAccessible(true);
				openSessionMethod.invoke(sessionManager, accountSession);
				
				log.info("Successfully opened launcher session");
				
				// Clean up session file after successful login
				try
				{
					Files.deleteIfExists(sessionPath);
				}
				catch (IOException e)
				{
					log.warn("Failed to clean up session file: {}", e.getMessage());
				}
			}
			catch (Exception e)
			{
				log.error("Failed to open launcher session", e);
			}
		}
		catch (Exception e)
		{
			log.error("Error reading launcher session", e);
		}
	}
	
	/**
	 * Gets the path to the launcher session file
	 */
	private Path getSessionFilePath()
	{
		String userHome = System.getProperty("user.home");
		return Paths.get(userHome, BLESSED_SCRIPTS_DIR, SESSION_FILE);
	}
	
	/**
	 * Launcher session data structure
	 */
	private static class LauncherSession
	{
		private String username;
		private String sessionId;
		private String accountId;
		private String selectedOn;
		
		public String getUsername()
		{
			return username;
		}
		
		public String getSessionId()
		{
			return sessionId;
		}
		
		public String getAccountId()
		{
			return accountId;
		}
		
		public String getSelectedOn()
		{
			return selectedOn;
		}
	}
}
