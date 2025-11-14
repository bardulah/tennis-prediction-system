#!/usr/bin/env python3
"""
Demo: Player Name Matching Functionality

This script demonstrates how the enhanced player name matching works
without requiring a database connection.

Usage:
    python3 demo_player_matching.py
"""

import re
from typing import List, Dict

def demo_find_players_by_name(search_name: str, mock_database: List[str], max_results: int = 5) -> List[Dict[str, str]]:
    """
    Demo version of find_players_by_name with mock database.
    """
    search_name = search_name.strip().title()
    matches = []
    
    # Strategy 1: Exact match
    for player in mock_database:
        if player.lower() == search_name.lower():
            matches.append({"full_name": player, "match_type": "exact"})
    
    # Strategy 2: Surname match (if search name is likely a surname)
    if len(search_name.split()) == 1:
        for player in mock_database:
            player_surname = player.split()[-1]  # Get last word
            if player_surname.lower() == search_name.lower():
                matches.append({"full_name": player, "match_type": "surname"})
    
    # Strategy 3: Partial name match
    for player in mock_database:
        if search_name.lower() in player.lower():
            matches.append({"full_name": player, "match_type": "partial"})
    
    # Remove duplicates
    unique_matches = []
    seen_names = set()
    for match in matches:
        if match["full_name"] not in seen_names:
            unique_matches.append(match)
            seen_names.add(match["full_name"])
            if len(unique_matches) >= max_results:
                break
    
    return unique_matches

def demo_expand_player_name(player_input: str, mock_database: List[str]) -> List[str]:
    """Demo version of expand_player_name."""
    player_input = player_input.strip()
    
    # First try exact match
    exact_matches = demo_find_players_by_name(player_input, mock_database, max_results=1)
    if exact_matches and exact_matches[0]["match_type"] == "exact":
        return [exact_matches[0]["full_name"]]
    
    # If no exact match, find all potential matches
    all_matches = demo_find_players_by_name(player_input, mock_database, max_results=10)
    
    if not all_matches:
        return []
    
    # If only one match, return it
    if len(all_matches) == 1:
        return [all_matches[0]["full_name"]]
    
    # Multiple matches - return all of them
    return [match["full_name"] for match in all_matches]

def main():
    """Demonstrate the player name matching functionality."""
    print("🎾 Player Name Matching Enhancement Demo")
    print("="*50)
    
    # Mock tennis player database
    mock_database = [
        "Novak Djokovic",
        "Rafael Nadal", 
        "Roger Federer",
        "Andy Murray",
        "Dominic Thiem",
        "Alexander Zverev",
        "Stefanos Tsitsipas",
        "Daniil Medvedev",
        "Carlos Alcaraz",
        "Jannik Sinner"
    ]
    
    print(f"\n📊 Mock Database ({len(mock_database)} players):")
    for player in mock_database:
        print(f"  • {player}")
    
    # Test cases
    test_cases = [
        ("Djokovic", "Should find Novak Djokovic by surname"),
        ("Nadal", "Should find Rafael Nadal by surname"),
        ("Federer", "Should find Roger Federer by surname"),
        ("Novak", "Should find Novak Djokovic by first name"),
        ("Rafael", "Should find Rafael Nadal by first name"),
        ("Roger", "Should find Roger Federer by first name"),
        ("Carlos", "Should find Carlos Alcaraz by first name"),
        ("Smith", "Should show no matches (not in database)"),
        ("Alcaraz", "Should find Carlos Alcaraz by surname"),
        ("Sinner", "Should find Jannik Sinner by surname")
    ]
    
    print(f"\n🧪 Testing Player Name Matching:")
    print("-" * 50)
    
    for test_input, description in test_cases:
        print(f"\nTest: '{test_input}'")
        print(f"Description: {description}")
        
        matches = demo_find_players_by_name(test_input, mock_database)
        
        if matches:
            print(f"✅ Found {len(matches)} match(es):")
            for match in matches:
                print(f"   • {match['full_name']} ({match['match_type']} match)")
        else:
            print(f"❌ No matches found")
        
        # Test expansion function
        expanded = demo_expand_player_name(test_input, mock_database)
        if expanded and len(expanded) == 1:
            print(f"📝 Expansion result: '{expanded[0]}'")
        elif expanded and len(expanded) > 1:
            print(f"📝 Multiple matches: {expanded}")
        
        print("-" * 30)
    
    # Demonstrate disambiguation
    print(f"\n🔍 Disambiguation Example:")
    print("-" * 30)
    
    # Add a player with same first name for disambiguation test
    mock_database_with_dupes = mock_database + ["Andy Murray Jr.", "Andy Murray Sr."]
    
    test_input = "Andy"
    print(f"Test: '{test_input}' (multiple Andys in database)")
    
    matches = demo_find_players_by_name(test_input, mock_database_with_dupes)
    
    if len(matches) > 1:
        print(f"⚠️  Multiple matches found - would show disambiguation:")
        print(f"   I found multiple players matching '{test_input}':")
        for match in matches:
            print(f"   • {match['full_name']}")
        print(f"   Which player are you interested in?")
    
    print(f"\n🎉 Demo Complete!")
    print(f"💡 Key Benefits:")
    print(f"   • Surname matching: 'Djokovic' → 'Novak Djokovic'")
    print(f"   • Partial matching: 'Novak' → 'Novak Djokovic'")
    print(f"   • Disambiguation: Multiple matches handled gracefully")
    print(f"   • User-friendly: No need to remember exact full names")

if __name__ == "__main__":
    main()
