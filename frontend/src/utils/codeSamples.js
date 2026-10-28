export const CODE_SAMPLES = {
  python: {
    review: `import os
import requests

# Example service routine
def fetch_user_data(user_id):
    # Potential security smell: hardcoded credentials
    api_key = "secret_api_token_12345"
    url = f"https://api.example.com/users/{user_id}"
    
    # Inefficient loop: repetitive requests
    results = []
    for i in range(5):
        res = requests.get(url, headers={"Authorization": api_key})
        results.append(res.json())
        print(f"Debug iteration {i}: {res.status_code}")
        
    return results`,

    optimize: `def find_two_sum(numbers, target):
    # Inefficient O(n^2) nested loop approach
    for i in range(len(numbers)):
        for j in range(i + 1, len(numbers)):
            if numbers[i] + numbers[j] == target:
                return [i, j]
    return []`,

    convert: `def process_transactions(transactions):
    valid_total = 0.0
    flagged = []
    
    for tx in transactions:
        amount = tx.get("amount", 0)
        status = tx.get("status")
        
        if status == "approved" and amount > 0:
            valid_total += amount
        elif status == "flagged":
            flagged.append(tx.get("id"))
            
    return {"total": valid_total, "flagged": flagged}`,
  },

  javascript: {
    review: `// User authentication handler
async function handleLogin(req, res) {
  const { username, password } = req.body;
  
  // Security smell: Plaintext secret
  const masterKey = "admin_master_jwt_secret_987";
  
  // Bug smell: Loose equality check
  if (username == 0 || password == null) {
    console.log("Empty credentials submitted");
    return res.status(400).send("Invalid input");
  }
  
  return res.json({ status: "authenticated" });
}`,

    optimize: `function removeDuplicates(items) {
  // Inefficient O(n^2) array lookup
  const unique = [];
  for (let i = 0; i < items.length; i++) {
    let exists = false;
    for (let j = 0; j < unique.length; j++) {
      if (items[i] === unique[j]) {
        exists = true;
        break;
      }
    }
    if (!exists) {
      unique.push(items[i]);
    }
  }
  return unique;
}`,

    convert: `function calculateMetrics(records) {
  let scoreSum = 0;
  const activeIds = [];

  for (const record of records) {
    if (record.active) {
      activeIds.push(record.id);
      scoreSum += record.score;
    }
  }

  const average = activeIds.length > 0 ? scoreSum / activeIds.length : 0;
  return { average, activeCount: activeIds.length };
}`,
  },

  java: {
    review: `public class DataProcessor {
    public static void process(int[] data) {
        String dbPassword = "hardcoded_password_123";
        
        for (int i = 0; i < data.length; i++) {
            for (int j = 0; j < data.length; j++) {
                if (data[i] == data[j]) {
                    System.out.println("Match at " + i + ", " + j);
                }
            }
        }
    }
}`,

    optimize: `import java.util.ArrayList;
import java.util.List;

public class SearchOptimizer {
    public static boolean hasDuplicate(List<Integer> list) {
        for (int i = 0; i < list.size(); i++) {
            for (int j = i + 1; j < list.size(); j++) {
                if (list.get(i).equals(list.get(j))) {
                    return true;
                }
            }
        }
        return false;
    }
}`,

    convert: `import java.util.*;

public class AccountManager {
    public static Map<String, Integer> countActive(List<String> statuses) {
        Map<String, Integer> map = new HashMap<>();
        for (String status : statuses) {
            map.put(status, map.getOrDefault(status, 0) + 1);
        }
        return map;
    }
}`,
  },

  cpp: {
    review: `#include <iostream>
#include <vector>

void inspectBuffer(const std::vector<int>& buffer) {
    const char* apiKey = "super_secret_cpp_key";
    
    for (size_t i = 0; i < buffer.size(); ++i) {
        for (size_t j = 0; j < buffer.size(); ++j) {
            std::cout << "Inspecting " << buffer[i] << std::endl;
        }
    }
}`,

    optimize: `#include <vector>

std::vector<int> findCommonElements(const std::vector<int>& a, const std::vector<int>& b) {
    std::vector<int> common;
    for (size_t i = 0; i < a.size(); ++i) {
        for (size_t j = 0; j < b.size(); ++j) {
            if (a[i] == b[j]) {
                common.push_back(a[i]);
            }
        }
    }
    return common;
}`,

    convert: `#include <vector>
#include <string>

struct UserRecord {
    std::string name;
    int score;
    bool active;
};

int sumActiveScores(const std::vector<UserRecord>& users) {
    int total = 0;
    for (const auto& u : users) {
        if (u.active) {
            total += u.score;
        }
    }
    return total;
}`,
  },
};
